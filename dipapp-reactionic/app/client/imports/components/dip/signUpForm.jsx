import React from 'react';
import {IonButton, IonItem} from 'reactionic';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import AgreeCondition from  './agreeCondition';
import UserService from './services/userService';

var SignUpForm = React.createClass({
    contextTypes: {
        popupNotification: React.PropTypes.func,
        closeNotification: React.PropTypes.func
    },
    handleChangeEmail: function (e) {
        this.email = e.target.value;
    },
    handleChangePassword: function (e) {
        this.password = e.target.value;
    },
    handleChangeName: function (e) {
        this.name = e.target.value;
    },
    validateSignUp: function () {
        if (!this.email || !this.password || !this.name) {
            this.context.popupNotification(LangEn.INPUT, LangEn.LOGIN_ERROR_ENTER_ALL_FIELDS);
            return false;
        }
        return true;
    },
    submitSignUp: function () {
        if (!this.validateSignUp()) {
            return;
        }
        var self = this;
        var user = {
            email: this.email,
            password: this.password,
            firstName: this.name
        };
        UserService.signUp(user)
            .then(function (res) {
                self.context.popupNotification('Sign up', 'success');
            }, function (error) {
                self.context.popupNotification('Error', error.details);
            });
    },
    render() {
        return (
            <form className="user-form sign-up-form">
                <IonItem input>
                    <div className="addon-icon">
                        <img src="/images/icons/icon_txt_email.png"/>
                    </div>
                    <input ref='email' type="email" placeholder={LangEn.EMAIL} onChange={this.handleChangeEmail}/>
                </IonItem>
                <IonItem input>
                    <div className="addon-icon">
                        <img src="/images/icons/icon_txt_name.png"/>
                    </div>
                    <input ref='fullName' type="text" placeholder={LangEn.FULL_NAME} onChange={this.handleChangeName} />
                </IonItem>
                <IonItem input>
                    <div className="addon-icon">
                        <img src="/images/icons/icon_txt_password.png"/>
                    </div>
                    <input ref='password' type="password" placeholder={LangEn.PASSWORD} onChange={this.handleChangePassword}/>
                </IonItem>
                <div className="password-condition">
                    <p>{LangEn.PASSWORD_MUST_HAVE}</p>
                    <ul>
                        <li>{LangEn.PASSWORD_MORE_CHARACTERS}</li>
                        <li>{LangEn.PASSWORD_AT_LEAST_DIGIT}</li>
                    </ul>
                </div>
                <AgreeCondition />
                <IonButton customClasses='submit-button' onClick={this.submitSignUp}>{LangEn.SIGN_UP}</IonButton>
            </form>
        );
    }
});

export default SignUpForm;
