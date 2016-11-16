import React from 'react';
import {Link} from 'react-router';
import _ from 'lodash';
import {
    IonNavView, IonView, IonContent, IonNavBar, IonNavBackButton, IonFooterBar, IonButton, IonIcon,
    IonSideMenuContainer, IonSideMenus, IonSideMenu, IonSideMenuContent, IonPopoverButton
} from 'reactionic';
import {DemoPopover} from '../popover';
import AppConfig from '../../constant/appConfigs';
import FacebookConnectPlugin from '../../lib/facebookConnectPlugin';

var Layout = React.createClass({
    contextTypes: {
        ionSnapper: React.PropTypes.object,
        ionShowPopover: React.PropTypes.func,
        ionPlatform: React.PropTypes.object,
        router: React.PropTypes.object.isRequired,
        location: React.PropTypes.object
    },
    getPageProps: function (path) {
        var backButton = (
            <IonNavBackButton icon="ion-ios-arrow-back"
                              color=""
                              type="clear"
                              customClasses="button-stage"
            />
        );

        // add defaults to pageListItems
        var pageList = this.props.pageList.map(function (page) {
            page.headerTitle = page.title;
            page.rightHeaderButton = null;
            page.leftHeaderButton = backButton;
            return page
        });

        var pageProps = _.keyBy(pageList, 'path');

        // custom pageProps
        pageProps['/'].leftHeaderButton = null;

        if (path === '/popover') {
            let icon = 'ion-more';
            if (this.context.ionPlatform.isAndroid) {
                icon = 'ion-android-more-vertical';
            }
            let demoPopover = <DemoPopover />
            pageProps['/popover'].rightHeaderButton = <IonPopoverButton type="clear" icon={icon} onClick={ () => {
                this.context.ionShowPopover(demoPopover)
            } }/>
        }

        if (path === '/sideMenus') {
            let icon = 'ion-navicon';
            if (this.context.ionPlatform.isAndroid) {
                icon = 'ion-android-more-vertical';
            }
            let leftButton = <IonButton type="clear" icon={icon} onClick={ () => {
                this.context.ionSnapper.toggle('left')
            } }/>
            let rightButton = <IonButton type="clear" icon={icon} onClick={ () => {
                this.context.ionSnapper.toggle('right')
            } }/>
            pageProps['/sideMenus'].leftHeaderButton = leftButton;
            pageProps['/sideMenus'].rightHeaderButton = rightButton;
        }


        return pageProps[path];
    },
    render() {
        var currentPageProps = this.getPageProps(this.context.location.pathname);
        /*if (!window.cordova) {
            //this is for browser only
            FacebookConnectPlugin.browserInit(AppConfig.FB_APP_ID);
        }*/
        return (
            <IonView customClasses="" {...this.props} scroll={false}>
                {React.cloneElement(this.props.children, {pageList: this.props.pageList})}
            </IonView>
        );
    }
});

export default Layout;
