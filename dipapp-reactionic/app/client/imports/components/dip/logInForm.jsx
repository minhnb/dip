import React from 'react';
import {IonButton, IonItem} from 'reactionic';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import AppConfig from '../../constant/appConfigs';
import DirectionalModal from  './directionalModal';
import ResetPasswordForm from './resetPasswordForm';
import UserService from './services/userService';

var ResetPasswordModal = React.createClass({
    render() {
        return (
            <DirectionalModal {...this.props} customTemplate={false} title={LangEn.RESET_PASSWORD}
                              barClasses="bar-light" modalStateKey={'webModal'} customClasses="modal-back-button">
                <ResetPasswordForm/>
            </DirectionalModal>
        );
    }
});

var LoginForm = React.createClass({
    contextTypes: {
        showWebModal: React.PropTypes.func,
        popupNotification: React.PropTypes.func,
        closeNotification: React.PropTypes.func
    },
    handleChangeEmail: function (e) {
        this.email = e.target.value;
    },
    handleChangePassword: function (e) {
        this.password = e.target.value;
    },
    validateLogin: function () {
        if (!this.email || !this.password) {
            this.context.popupNotification(LangEn.INPUT, LangEn.LOGIN_ERROR_ENTER_ALL_FIELDS);
            return false;
        }
        return true;
    },
    submitLogin: function () {
        if (!this.validateLogin()) {
            return;
        }
        var self = this;
        UserService.login(this.email, this.password)
            .then(function (res) {
                self.context.popupNotification('Login success', res.JWT);
            }, function (error) {
                self.context.popupNotification('Error', error.details);
            });
    },
    render() {
        var resetPasswordModal = <ResetPasswordModal {...this.props} />;
        return (
            <form className="user-form">
                <IonItem input>
                    <div className="addon-icon">
                        <img src="/images/icons/icon_txt_email.png"/>
                    </div>
                    <input ref='email' type="email" placeholder={LangEn.EMAIL} onChange={this.handleChangeEmail}/>
                </IonItem>
                <IonItem input>
                    <div className="addon-icon">
                        <img src="/images/icons/icon_txt_password.png"/>
                    </div>
                    <input ref='password' type="password" placeholder={LangEn.PASSWORD}
                           onChange={this.handleChangePassword}/>
                </IonItem>
                <IonButton customClasses='submit-button' onClick={this.submitLogin}>{LangEn.LOG_IN}</IonButton>
                <div><a onClick={() => this.context.showWebModal(resetPasswordModal)}>{LangEn.FORGOT_PASSWORD}</a></div>
            </form>
        );
    }
});

export default LoginForm;
