import React from 'react';
import {IonButton, IonItem} from 'reactionic';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import AppConfig from '../../constant/appConfigs';
import DirectionalModal from  './directionalModal';
import AgreeCondition from  './agreeCondition';
import LogInForm from  './logInForm';
import SignUpForm from  './signUpForm';
import UserService from './services/userService';
import FacebookConnectPlugin from '../../lib/facebookConnectPlugin';

var LoginSignUpModalFirstPage = React.createClass({
    contextTypes: {
        ionPlatform: React.PropTypes.object,
        nextSlide: React.PropTypes.func,
        previousSlide: React.PropTypes.func,
        popupNotification: React.PropTypes.func,
        closeNotification: React.PropTypes.func
    },
    dipFacebookLogin: function (accessToken) {
        var self = this;
        return UserService.fbLogin(accessToken)
            .then(function (res) {
                self.context.popupNotification('Login success', res.JWT);
            }, function (error) {
                self.context.popupNotification('Error', error.details);
            });
    },
    facebookConnect: function () {
        var self = this;
        var fbLogin, accessToken;
        FacebookConnectPlugin.getLoginStatus(function (res) {
            fbLogin = res;

            if (fbLogin.status === 'connected') {
                accessToken = fbLogin.authResponse.accessToken;
                // console.log(JSON.stringify(accessToken));
                self.context.popupNotification('accessToken', accessToken);
                self.dipFacebookLogin(accessToken);
            }
            else {
                FacebookConnectPlugin.login(['email', 'public_profile'], function (res) {
                    fbLogin = res;
                    accessToken = fbLogin.authResponse.accessToken;
                    // console.log(JSON.stringify(accessToken));
                    self.context.popupNotification('accessToken', accessToken);
                    self.dipFacebookLogin(accessToken);
                }, function (error) {
                    // console.log(JSON.stringify(error));
                    self.context.popupNotification('Error', JSON.stringify(error));
                });
            }
        }, function (error) {
            // console.log(JSON.stringify(error));
            self.context.popupNotification('Error', JSON.stringify(error));
        });
    },
    render() {
        if (!window.cordova) {
            //this is for browser only
            FacebookConnectPlugin.browserInit(AppConfig.FB_APP_ID, "v2.4");
        }
        return (
            <div className="login-signup-modal" {...this.props}>
                <IonButton customClasses="fb-button" onClick={this.facebookConnect}>
                    <div className="button-image">
                        <img src="/images/icons/icon_fb_white.png"/>
                    </div>
                    {LangEn.CONNECT_WITH_FACEBOOK}
                </IonButton>
                <div className="divider">
                    <span>{LangEn.OR}</span>
                </div>
                <IonButton onClick={() => this.context.nextSlide()}>
                    <div className="button-image">
                        <img src="/images/icons/icon_txt_email.png"/>
                    </div>
                    {this.props.buttonEmailText}
                </IonButton>
                <AgreeCondition {...this.props} />
            </div>
        )
    }
});


var ModalContent = React.createClass({
    contextTypes: {
        setCloseModalAction: React.PropTypes.func,
        closeCurrentModal: React.PropTypes.func,
        setModalSlide: React.PropTypes.func
    },
    childContextTypes: {
        nextSlide: React.PropTypes.func,
        previousSlide: React.PropTypes.func
    },
    getChildContext: function () {
        return {
            nextSlide: this.nextSlide,
            previousSlide: this.previousSlide
        };
    },
    getInitialState: function () {
        return {
            animationClass: '',
            currentSlide: 0
        };
    },
    getDefaultProps: function () {
        return {
            buttonEmailText: ''
        };
    },
    nextSlide: function () {
        this.setState({animationClass: 'slide-to-right'});
        this.state.currentSlide++;
    },
    previousSlide: function () {
        this.setState({animationClass: 'slide-to-left'});
        this.state.currentSlide--;
    },
    buttonCloseHandle: function () {
        if (this.state.currentSlide > 0) {
            this.previousSlide();
            return;
        }
        this.context.closeCurrentModal();
    },
    render() {
        this.context.setModalSlide(this);
        return (
            <div className={"slide-modal-content " + this.state.animationClass}>
                <div>
                    <LoginSignUpModalFirstPage {...this.props} />
                </div>
                <div>
                    {
                        this.props.buttonEmailText == LangEn.LOGIN_WITH_EMAIL ? <LogInForm /> : <SignUpForm/>
                    }
                </div>
            </div>
        );
    }
});


var LogInModal = React.createClass({
    render() {
        var logInProps = {
            buttonEmailText: LangEn.LOGIN_WITH_EMAIL
        };
        return (
            <DirectionalModal {...this.props} customTemplate={false} title={LangEn.LOG_IN}
                              barClasses="bar-light" modalStateKey={'directionalModal'}>
                <ModalContent {...logInProps}/>
            </DirectionalModal>
        );
    }
});


var SignUpModal = React.createClass({
    render() {
        var signUpProps = {
            buttonEmailText: LangEn.SIGN_UP_WITH_EMAIL
        };
        return (
            <DirectionalModal {...this.props} customTemplate={false} title={LangEn.CREATE_ACCOUNT}
                              barClasses="bar-light" modalStateKey={'directionalModal'}>
                <ModalContent {...signUpProps}/>
            </DirectionalModal>
        );
    }
});

export default ModalContent;
export {LogInModal, SignUpModal}
