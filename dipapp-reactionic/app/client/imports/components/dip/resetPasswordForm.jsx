import React from 'react';
import {IonButton, IonItem} from 'reactionic';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import UserService from './services/userService';

var ResetPasswordForm = React.createClass({
    contextTypes: {
        closeCurrentModal: React.PropTypes.func,
        showWebModal: React.PropTypes.func,
        popupNotification: React.PropTypes.func,
        closeNotification: React.PropTypes.func
    },
    getInitialState: function () {
        return {
            hasVerificationCode: false
        };
    },
    handleChangeEmail: function (e) {
        this.email = e.target.value;
    },
    handleChangePassword: function (e) {
        this.password = e.target.value;
    },
    handleChangeConfirmPassword: function (e) {
        this.confirmPassword = e.target.value;
    },
    handleChangeVerificationCode: function (e) {
        this.verificationCode = e.target.value;
    },
    validateEmail: function () {
        if (!this.email) {
            this.context.popupNotification(LangEn.EMPTY_EMAIL, LangEn.RESET_PASSWORD_ERROR_ENTER_EMAIL);
            return false;
        }
        return true;
    },
    validateResetPasswordFields: function () {
        if (!this.password || !this.confirmPassword || !this.verificationCode) {
            this.context.popupNotification(LangEn.RESET_PASSWORD, LangEn.RESET_PASSWORD_ERROR_ENTER_ALL_FIELDS);
            return false;
        }
        if (this.password != this.confirmPassword) {
            this.context.popupNotification(LangEn.MISMATCHED_PASSWORD, LangEn.RESET_PASSWORD_ERROR_PASSWORD_NOT_MATCH);
        }
        return true;
    },
    sendEmailResetPassword: function () {
        if (!this.validateEmail()) {
            return;
        }
        var self = this;
        UserService.sendResetPasswordTokenToEmail(this.email)
            .then(function (res) {
                self.setState({hasVerificationCode: true});
            }, function (error) {
                self.context.popupNotification('Error', error.details);
            });
    },
    resetPassword: function () {
        if (!this.validateResetPasswordFields()) {
            return;
        }
        var self = this;
        UserService.resetPassword(this.verificationCode, this.password)
            .then(function (res) {
                self.context.closeCurrentModal();
            }, function (error) {
                self.context.popupNotification('Error', error.details);
            });
    },
    render() {
        return (
            <div>
                {
                    this.state.hasVerificationCode ?
                        <form className="user-form reset-password">
                            <p className="instruction-prompt">{LangEn.RESET_PASSWORD_CHECK_EMAIL}</p>
                            <IonItem input>
                                <div className="addon-icon">
                                    <img src="/images/icons/icon_txt_password.png"/>
                                </div>
                                <input ref='verificationCode' type="number" placeholder={LangEn.VERIFICATION_CODE}
                                       onChange={this.handleChangeVerificationCode}/>
                            </IonItem>
                            <IonItem input>
                                <div className="addon-icon">
                                    <img src="/images/icons/icon_txt_password.png"/>
                                </div>
                                <input ref='newPassword' type="password" placeholder={LangEn.NEW_PASSWORD}
                                       onChange={this.handleChangePassword}/>
                            </IonItem>
                            <IonItem input>
                                <div className="addon-icon">
                                    <img src="/images/icons/icon_txt_password.png"/>
                                </div>
                                <input ref='confirmPassword' type="password" placeholder={LangEn.CONFIRM_PASSWORD}
                                       onChange={this.handleChangeConfirmPassword}/>
                            </IonItem>
                            <IonButton customClasses='submit-button' onClick={this.resetPassword}>{LangEn.RESET}</IonButton>
                        </form>
                        :
                        <form className="user-form">
                            <IonItem input>
                                <div className="addon-icon">
                                    <img src="/images/icons/icon_txt_email.png"/>
                                </div>
                                <input ref='email' type="email" placeholder={LangEn.EMAIL} onChange={this.handleChangeEmail}/>
                            </IonItem>
                            <IonButton customClasses='submit-button' onClick={this.sendEmailResetPassword}>{LangEn.SEND}</IonButton>
                        </form>
                }
            </div>
        );
    }
});

export default ResetPasswordForm;
