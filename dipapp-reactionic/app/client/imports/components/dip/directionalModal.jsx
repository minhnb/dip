import React from 'react';
import classnames from 'classnames';

var DirectionalModal = React.createClass({
    propTypes: {
        customClasses: React.PropTypes.string,
        customTemplate: React.PropTypes.bool,
        title: React.PropTypes.string,
        closeText: React.PropTypes.string,
        focusFirstInput: React.PropTypes.bool,
        barClasses: React.PropTypes.string
    },
    getDefaultProps: function () {
        return {
            customClasses: '',
            customTemplate: false,
            title: '',
            closeText: '',
            focusFirstInput: false,
            barClasses: 'bar-stable'
        };
    },
    contextTypes: {
        closeModal: React.PropTypes.func,
        ionKeyboardHeight: React.PropTypes.number,
        ionPlatform: React.PropTypes.object
    },
    childContextTypes: {
        closeCurrentModal: React.PropTypes.func,
        setModalSlide: React.PropTypes.func
    },
    getChildContext: function () {
        return {
            closeCurrentModal: this.closeCurrentModal,
            setModalSlide: this.setModalSlide
        };
    },
    backdropClicked: function (e) {
        e.preventDefault();
        if (e.target.className.indexOf("modal-backdrop") >= 0) {
            // if clicked on backdrop outside of the modal, close modal
            this.context.showDirectionalModal(false);
        }
    },
    componentDidMount() {
        if (this.props.focusFirstInput) {
            var input = document.querySelector("input"); // select first input
            input && input.focus();
        }
    },
    closeCurrentModal: function () {
        this.context.closeModal(this.props.modalStateKey);
    },
    closeModalAction: function () {
        if (this.slide) {
            this.slide.buttonCloseHandle();
        } else {
            this.closeCurrentModal();
        }
    },
    setModalSlide: function (slide) {
        this.slide = slide;
    },
    render() {
        var classes = classnames(
            {'modal': true},
            this.props.customClasses
        );
        var backdropClasses = classnames(
            {
                'modal-backdrop': true,
                'active': this.props.children
            }
        );
        var barClasses = classnames(
            'bar bar-header',
            this.props.barClasses
        );
        var titleClasses = classnames(
            {
                'title': true,
                'title-left': this.context.ionPlatform.isAndroid
            }
        );
        var closeButton;
        if (this.props.closeText) {
            closeButton = <button onClick={ () => this.closeModalAction() }
                                  className="button button-positive button-clear">{this.props.closeText}</button>;
        } else {
            closeButton = <button onClick={ () => this.closeModalAction() } className="button button-icon">
                <div className="img-bg"></div>
            </button>;
        }
        var contents;
        if (this.props.customTemplate) {
            contents = (
                <div className={classes}>
                    {this.props.children}
                </div>
            );
        } else {
            contents = (
                <div className={classes}>
                    <div className={barClasses}>
                        <h2 className={titleClasses}>{this.props.title}</h2>{closeButton}
                    </div>
                    <div className="content has-header overflow-scroll">
                        <div className="padding">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className={backdropClasses} onClick={this.backdropClicked}>
                <div className="modal-wrapper">
                    {contents}
                </div>
            </div>
        );
    }
});

export default DirectionalModal;