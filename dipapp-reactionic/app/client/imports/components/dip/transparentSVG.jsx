import React from 'react';

var TransparentSVG = React.createClass({
    contextTypes: {
        ionPlatform: React.PropTypes.object
    },
    getDefaultProps: function() {
        return {
            maskId: '',
            text: ''
        };
    },
    render() {
        return (
            <svg width="115" height="35" {...this.props}>
                <mask id={this.props.maskId}>
                    <rect width="115" height="35" x="0" y="0" fill="white" />
                    <text textAnchor="middle" x="58" y="65%">{this.props.text}</text>
                </mask>
                <rect width="115" height="35" x="0" y="0" fill="white" mask={"url(#" + this.props.maskId  + ")"} />
            </svg>
        )
    }
});

export default TransparentSVG;
