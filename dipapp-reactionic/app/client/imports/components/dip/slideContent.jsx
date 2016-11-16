import React from 'react';

var SlideContent = React.createClass({
    contextTypes: {
        ionPlatform: React.PropTypes.object
    },
    getDefaultProps: function() {
        return {
            imageSrc: '',
            title: '',
            details: ''
        };
    },
    render() {
        return (
            <div {...this.props}>
                <img src={this.props.imageSrc}/>
                <div className="slide-cover">
                </div>
                <div className="slide-text">
                    <p className="title">{this.props.title}</p>
                    <p>{this.props.details}</p>
                </div>
            </div>
        )
    }
});

export default SlideContent;
