import React from 'react';
import {
  StyleSheet,
  Text,
  Image,
  View,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';

import SubscriptionBox from '../../../components/SubscriptionBox';
import commonStyles from '../../../constants/commonStyles';
import {
  getNextDeliveryDate,
  getNextPaymentDate,
  parseDeliveryTime,
  formatDate,
} from '../../../utils/dateTime';
import Colors from '../../../constants/Colors';
import Layout from '../../../constants/Layout';
import Loader from '../../../components/Loader';
import { getUserProfile } from '../../../actions/auth';
import { setSelectedOrder } from '../../../actions/order';
import { setSelectedSubscription } from '../../../actions/checkout';

const width = Layout.window.width;

class MySubscriptionScreen extends React.Component {
  static navigationOptions = {
    headerTitle: '',
    headerBackTitle: null,
    headerTransparent: true,
    headerTitleStyle: {
      ...commonStyles.fontRalewayBold,
      fontSize: 18,
    },
    headerStyle: {
      marginTop: 10,
    },
  };
  state = {
    // Fetch all orders of this current month (eg. all orders that are in range of February)
    // Order is inactive only if all subscriptions are canceled (not part of it)
    currentOrders: [
      {
        id: 123,
        isActive: true,
        subscriptions: [
          {
            id: 1,
            title: 'Mixed',
            isActive: true,
          },
          {
            id: 2,
            title: 'Vegan',
            isActive: true,
          },
        ],
        deliveryDayOfWeek: 'Tuesday',
        deliveryTime: '10:00-12:00',
        orderDate: '2019/02/02',
      },
      {
        id: 124,
        isActive: false,
        subscriptions: [
          {
            id: 3,
            title: 'Meat',
            isActive: false,
          },
        ],
        deliveryDayOfWeek: 'Wednesday',
        deliveryTime: '16:00-18:00',
        orderDate: '2019/02/08',
      },
    ],
  };

  componentDidMount() {
    this.props.getUserProfile();
  }

  getOrderNextDeliveryDate = order => {
    let nextDeliveryDate = getNextDeliveryDate(order.deliveryDayOfWeek),
      now = new Date();
    /* Check if next delivery date falls into today and already passes delivery time (means that subscription
    has already been delivered), then get another next delivery date */
    if (
      nextDeliveryDate.toDateString() === now.toDateString() &&
      now.getHours() > parseDeliveryTime(order.deliveryTime)
    ) {
      nextDeliveryDate = getNextDeliveryDate(order.deliveryDayOfWeek, 14);
    }
    return formatDate(nextDeliveryDate);
  };

  getOrderEndSubscriptionDate = orderDate => {
    let nextPaymentDate = getNextPaymentDate(orderDate);
    return formatDate(nextPaymentDate);
  };

  onPressAddSubscription = () => {
    this.props.navigation.navigate('AddSubscription');
  };

  onPressManageSubscription = order => {
    this.props.setSelectedOrder(order);
    this.props.navigation.navigate('SubscriptionManagement');
  };

  onPressSubscriptionDetails = subscription => {
    this.props.setSelectedSubscription(subscription);
    this.props.navigation.navigate('SubscriptionDetail');
  };

  renderSubscriptionListPerOrder = () => {
    return this.props.user.orders
      .filter(
        o =>
          o.cancelDate === null ||
          moment().diff(moment(o.cancelDate), 'months') === 0
      )
      .map(order => (
        <View key={order.id} style={styles.subscriptionOrderContainer}>
          <Text style={styles.deliveryDateTitle}>
            Next Delivery Date: {this.getOrderNextDeliveryDate(order)}
          </Text>
          {order.cancelDate !== null && (
            <Text style={styles.endSubscriptionText}>
              *Your subscription will end on{' '}
              {this.getOrderEndSubscriptionDate(order.paymentDate)}
            </Text>
          )}
          <View style={styles.subscriptionBoxContainer}>
            {order.items &&
              this.renderSubscriptionBoxes(
                order.items,
                order.cancelDate === null
              )}
          </View>
          <Button
            type={'clear'}
            title={'Manage your subscriptions'}
            icon={
              <Icon name={'chevron-right'} size={18} color={Colors.darkGrey} />
            }
            iconRight={true}
            titleStyle={[styles.manageButtonText, { marginRight: 2 }]}
            buttonStyle={{ alignItems: 'center' }}
            containerStyle={styles.manageButtonContainer}
            onPress={() => this.onPressManageSubscription(order)}
          />
        </View>
      ));
  };

  renderSubscriptionBoxes = (subscriptionList, isOrderActive) => {
    return subscriptionList.map(subscription => {
      return (
        <TouchableOpacity
          onPress={() => this.onPressSubscriptionDetails(subscription)}
          key={subscription.id}
        >
          <SubscriptionBox
            subscriptionTitle={subscription.title}
            isActive={isOrderActive}
          />
        </TouchableOpacity>
      );
    });
  };

  render() {
    const { user } = this.props;

    if (_.isEmpty(user)) {
      return <Loader />;
    }

    return (
      <View
        style={[
          styles.mainContainer,
          user.orders &&
            user.orders.length === 0 && { justifyContent: 'center' },
        ]}
      >
        {user.orders && user.orders.length > 0 ? (
          <View
            style={[
              {
                paddingLeft: 32,
              },
              styles.mainContainer,
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.mainTitle}>Current subscriptions</Text>
              {this.renderSubscriptionListPerOrder()}
            </ScrollView>
            <TouchableHighlight onPress={this.onPressAddSubscription}>
              <View style={styles.addSubscriptionButtonContainer}>
                <Icon name={'shopping-basket'} size={28} color={Colors.white} />
                <Icon
                  name={'add-circle'}
                  size={14}
                  color={Colors.macaroniCheese}
                  containerStyle={styles.addCircleIcon}
                />
              </View>
            </TouchableHighlight>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.emptyOrderTitle}>
              You haven't subscribed to any box !
            </Text>
            <Button
              title={'Add new subscriptions'}
              titleStyle={styles.emptyOrderBtnTitle}
              buttonStyle={styles.emptyOrderBtnStyle}
              onPress={this.onPressAddSubscription}
            />
            <Image
              source={require('../../../assets/images/emptyBox.png')}
              style={{ height: 152, width: 151 }}
            />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: width,
    marginTop: 40,
  },
  mainTitle: {
    ...commonStyles.fontRalewayBold,
    ...commonStyles.textMediumCarmine,
    fontSize: 24,
  },
  subscriptionOrderContainer: {
    marginTop: 28,
  },
  deliveryDateTitle: {
    ...commonStyles.fontRalewayBold,
    ...commonStyles.textMediumCarmine,
    fontSize: 14,
  },
  endSubscriptionText: {
    ...commonStyles.fontRalewayMedium,
    ...commonStyles.textGrey,
    fontSize: 10,
    marginTop: 13,
  },
  subscriptionBoxContainer: {
    marginLeft: 6,
    marginTop: 21,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: 315,
  },
  manageButtonText: {
    ...commonStyles.fontRalewaySemiBold,
    ...commonStyles.textGrey,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  manageButtonContainer: {
    margin: 'auto',
    marginTop: 24,
  },
  addSubscriptionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    position: 'absolute',
    bottom: 14,
    right: 14,

    width: 56,
    height: 56,

    borderRadius: 100,
    backgroundColor: Colors.mediumCarmine,

    shadowColor: Colors.darkGrey,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addCircleIcon: {
    position: 'absolute',
    right: 10,
    top: 14,
  },
  emptyOrderTitle: {
    ...commonStyles.fontRalewayBold,
    ...commonStyles.textBlack,
    fontSize: 18,
    marginBottom: 34,
  },
  emptyOrderBtnStyle: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 88,
    borderRadius: 26,
    backgroundColor: Colors.mediumCarmine,
  },
  emptyOrderBtnTitle: {
    ...commonStyles.fontRalewayBold,
    ...commonStyles.white,
    fontSize: 16,
  },
});

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { getUserProfile, setSelectedOrder, setSelectedSubscription }
)(MySubscriptionScreen);
