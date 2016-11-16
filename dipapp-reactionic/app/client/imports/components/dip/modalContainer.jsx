import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

var IonModalContainer = React.createClass({
    propTypes: {
        animation: React.PropTypes.string
    },
    getDefaultProps: function() {
        return {
            animation: 'slide-in-up'
        };
    },
    render() {
        return (
            <ReactCSSTransitionGroup
                component="div"
                transitionEnterTimeout={400}
                transitionLeaveTimeout={250}
                transitionName="modal"
                className={"modal-"+this.props.animation}
            >
                {this.props.children}
            </ReactCSSTransitionGroup>
        );
    }
});

export default IonModalContainer;
