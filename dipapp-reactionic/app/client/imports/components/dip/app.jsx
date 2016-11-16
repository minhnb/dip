import React from 'react';
import {IonBody, IonButton} from 'reactionic';
import ModalContainer from './modalContainer'
import {getPlatform} from '../utils/helpers.jsx';
import AppConstant from '../../constant/appConstants';
import DIPNotification from './notification';

var App = React.createClass({
    getInitialState: function () {
        return {
            platformOverride: this.props.location.query.platformOverride,
            showNotification: false,
            notification: {}
        };
    },
    childContextTypes: {
        directionalModal: React.PropTypes.oneOfType([React.PropTypes.object,React.PropTypes.bool]),
        showDirectionalModal: React.PropTypes.func,
        webModal: React.PropTypes.oneOfType([React.PropTypes.object,React.PropTypes.bool]),
        showWebModal: React.PropTypes.func,
        closeModal: React.PropTypes.func,
        popupNotification: React.PropTypes.func,
        closeNotification: React.PropTypes.func
    },
    getChildContext: function() {
        return {
            directionalModal: this.state.directionalModal,
            showDirectionalModal: this.showDirectionalModal,
            webModal: this.state.directionalModal,
            showWebModal: this.showWebModal,
            closeModal: this.closeModal,
            popupNotification: this.popupNotification,
            closeNotification: this.closeNotification
        };
    },
    showDirectionalModal(modal, direction) {
        if (modal) {
            direction = direction ? direction : AppConstant.MODAL_DIRECTION_UP;
            this.setState({modalAnimation: direction});
        }
        this.setState({ directionalModal: modal });
    },
    showWebModal: function (modal) {
        this.setState({webModal: modal});
    },
    closeModal: function (modalStateKey) {
        var newModalState = {};
        if (!modalStateKey) {
            modalStateKey = 'ionModal';
        }
        newModalState[modalStateKey] = false;
        this.setState(newModalState);
    },
    popupNotification: function (title, message, buttonTitle) {
        var notification = {
            message: message
        };
        if (title) {
            notification.title = title;
        }
        if (buttonTitle) {
            notification.buttonTitle = buttonTitle;
        }
        this.setState({showNotification: true, notification: notification});
    },
    closeNotification: function () {
        this.setState({showNotification: false});
    },
    componentWillReceiveProps: function (newProps) {
        var newPlatformOverride = newProps.location.query.platformOverride;
        if (newPlatformOverride) {
            if (newPlatformOverride !== this.state.platformOverride) {
                this.setState({platformOverride: newPlatformOverride});
            }
        }
    },
    render() {
        var platform = getPlatform(this.state.platformOverride);

        return (
            <div className={this.state.showNotification ? 'filter-blur' : ''}>
                <IonBody platform={platform} location={this.props.location}>
                    { React.cloneElement(this.props.children, {pageList: this.props.route.pageList}) }
                    <ModalContainer animation={this.state.modalAnimation}>{this.state.directionalModal}</ModalContainer>
                    <ModalContainer animation={AppConstant.MODAL_DIRECTION_RIGHT}>{this.state.webModal}</ModalContainer>
                </IonBody>
                {
                    this.state.showNotification ? <DIPNotification {...this.state.notification}/> : null
                }
            </div>
        );
    }
});

export default App;
