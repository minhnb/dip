import React from 'react';
import LangEn from '../../constant/en';
import AppConstant from '../../constant/appConstants';
import DirectionalModal from  './directionalModal';
import Iframe from 'react-iframe';

var TermOfServiceWebModal = React.createClass({
    render() {
        return (
            <DirectionalModal {...this.props} customTemplate={false} title={LangEn.TERM_OF_SERVICE}
                              barClasses="bar-light" modalStateKey={'webModal'} customClasses="modal-back-button web-modal">
                <div className="iframe-container">
                    <Iframe url="http://www.thedipapp.com/terms-of-service/" width="1px"/>
                </div>
            </DirectionalModal>
        );
    }
});

var PrivacyPolicyWebModal = React.createClass({
    render() {
        return (
            <DirectionalModal {...this.props} customTemplate={false} title={LangEn.PRIVACY_POLICY}
                              barClasses="bar-light" modalStateKey={'webModal'} customClasses="modal-back-button web-modal">
                <div className="iframe-container">
                    <Iframe url="http://www.thedipapp.com/privacy-policy/" width="1px"/>
                </div>
            </DirectionalModal>
        );
    }
});

var AgreeCondition = React.createClass({
    contextTypes: {
        showWebModal: React.PropTypes.func
    },
    render() {
        var termOfServiceWebModal = <TermOfServiceWebModal {...this.props} />;
        var privacyPolicyWebModal = <PrivacyPolicyWebModal {...this.props} />;
        return (
            <div className="agree-condition" {...this.props}>
                <span>{LangEn.BY_SIGNING_UP_AGREE}</span>
                <br/>
                <a onClick={() => this.context.showWebModal(termOfServiceWebModal)}>{LangEn.TERM_OF_SERVICE}</a><span> and </span><a
                onClick={() => this.context.showWebModal(privacyPolicyWebModal)}>{LangEn.PRIVACY_POLICY}</a>
            </div>
        );
    }
});

export default AgreeCondition;
