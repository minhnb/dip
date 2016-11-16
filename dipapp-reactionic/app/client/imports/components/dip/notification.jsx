import React from 'react';
import {IonButton} from 'reactionic';
import LangEn from '../../constant/en';

var DIPNotification = React.createClass({
    propTypes: {
        animation: React.PropTypes.string
    },
    contextTypes: {
        closeNotification: React.PropTypes.func
    },
    closeNotificationLayer: function () {
        this.context.closeNotification();
    },
    getDefaultProps: function() {
        return {
            title: LangEn.ERROR,
            message: '',
            buttonTitle: LangEn.OK
        };
    },
    render() {
        return (
            <div className="dip-notification-layer">
                <div className="notification-title">
                    {this.props.title}
                </div>
                <div className="notification-message">
                    {this.props.message}
                </div>
                <IonButton onClick={() => this.closeNotificationLayer()}>{this.props.buttonTitle}</IonButton>
            </div>
        );
    }
});

export default DIPNotification;
