import React from 'react';
import {IonContent, IonSlideBox, IonModal, IonModalContainer, IonButton} from 'reactionic';
import ReactSlick from 'react-slick';
// import ReactSwipe from 'react-swipe';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import SlideContent from  './slideContent';
import TransparentSVG from  './transparentSVG';
import DirectionalModal from  './directionalModal';
import { LogInModal, SignUpModal } from  './loginSignupModalContent';


var IntroductionSlide = React.createClass({
    contextTypes: {
        ionSnapper: React.PropTypes.object,
        ionShowModal: React.PropTypes.func,
        showDirectionalModal: React.PropTypes.func
    },
    componentDidMount() {
        if (this.context.ionSnapper && this.context.ionSnapper.disable) {
            this.context.ionSnapper.disable();
        }
    },
    componentWillUnmount() {
        if (this.context.ionSnapper && this.context.ionSnapper.enable) {
            this.context.ionSnapper.enable();
        }
    },
    render() {
        var settings = {
            className: 'ion-slide-box',
            infinite: true,
            autoplay: false,
            arrows: false,
            dots: true,
            dotsClass: 'slick-dots slider-pager',
            initialSlide: 0,
            swipe: true,
            mobileFirst: true,
            swipeToSlide: true
        };
        var slides = [
            {
                imageSrc: "/images/large/slider_onboard_1.png",
                title: LangEn.HOTELS_UNLOCKED,
                details: LangEn.ACCESS_HOTEL
            },
            {
                imageSrc: "/images/large/slider_onboard_2.png",
                title: LangEn.AMENITIES_ON_DEMAND,
                details: LangEn.EXPERIENCE_FINGERTIPS
            },
            {
                imageSrc: "/images/large/slider_onboard_3.png",
                title: LangEn.WELCOME_TO_DIP,
                details: LangEn.WHAT_ARE_YOU_WAITING_FOR
            }
        ];
        var logInModal = <LogInModal {...this.props} />;
        var signUpModal = <SignUpModal {...this.props} />;
        return (
            <IonContent customClasses="slider-content-fix"
                        scroll={false}
                        {...this.props}>
                <ReactSlick {...settings}>
                    {
                        slides.map((slide, i) => {
                            return (
                                <SlideContent key={i} {...slide} />
                            )
                        })
                    }
                </ReactSlick>
                <div className="slide-center-buttons">
                    <div>
                        <IonButton onClick={() => this.context.showDirectionalModal(logInModal, AppConstant.MODAL_DIRECTION_DOWN)}>
                            <TransparentSVG text={LangEn.LOG_IN} maskId="logintext"/>
                        </IonButton>
                        <IonButton onClick={() => this.context.showDirectionalModal(signUpModal, AppConstant.MODAL_DIRECTION_DOWN)}>
                            <TransparentSVG text={LangEn.SIGN_UP} maskId="signuptext"/>
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        )
    }
});

export default IntroductionSlide;
