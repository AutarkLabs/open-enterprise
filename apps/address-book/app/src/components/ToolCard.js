import React, { Component }  from 'react'
import styled from 'styled-components'

import {
    Card,
    ContextMenu,
    ContextMenuItem,
    IconSettings,
    IconAdd,
    Text,
    theme
} from '@aragon/ui'

import icon from '../assets/empty-card-icon.svg'

const { accent, textPrimary, textTertiary } = theme

const initialState = {
    contextMenuItems: [
        {
            text: 'New Payout Vote',
            icon: IconAdd,
            function: 'openNewPayoutVote',
            colors: {
                iconColor: textTertiary,
                labelColor: textPrimary
            }
        },
        {
            text: 'Manage Parameters',
            icon: IconSettings,
            function: 'openManageParemeters',
            colors: { iconColor: accent }
        }
    ],
}

class ToolCard extends Component {
    state = {
        ...initialState,
    }

    openNewPayoutVote = () => {
        if (typeof this.props.openSidePanelLink === "function") {
            this.props.openSidePanelLink()
        } else {
            console.info('ToolCard component: openSidePanelLink not defined, click has no effect')
        }
    }

    openManageParemeters = () => {}

    render () {
        const { label, description, stats, address } = this.props
        const { contextMenuItems } = this.state
        console.log(this.props)
        const menuElements = contextMenuItems.map((item) =>
            <StyledMenuItem
                key={item.text}
                onClick={this[item.function]} // this[item.handler]
                colors={item.colors}>
                {React.createElement(item.icon)}
                {item.text}
            </StyledMenuItem>
        )

        const statsElements = stats.map((stat) =>
            <React.Fragment key={stat.label}>
                <Text
                    size="xxsmall"
                    color={textTertiary}>
                    {stat.label}
                </Text>
                <Text
                    size="xsmall"
                    color={textPrimary}>
                    {stat.value}
                </Text>
            </React.Fragment>
        )

        return (
            <StyledCard>
                <ContextMenu>
                    {menuElements}
                </ContextMenu>
                <img src={icon} alt={`${label} icon`} />
                <Text size="large" color={textPrimary}>
                    {label}
                </Text>
                <Text size="small" color={textTertiary}>
                    {description}
                </Text>
                {statsElements}
                <Text size="xsmall" color={accent}>
                    {address}
                </Text>
                </StyledCard>
        )
    }
}

const StyledCard = styled(Card)`
    height: 312px;
    width: 280px;
    display: grid;
    grid-template-columns: repeat(4, 25%);
    grid-template-areas:
        ".    icon icon menu"
        ".    icon icon .   "
        "labl labl labl labl"
        "desc desc desc desc"
        "sta1 sta1 sta2 sta2"
        "val1 val1 val2 val2"
        "addr addr .    .   ";
    grid-gap: 12px 0;

    & > :nth-child(1) {
        grid-area: menu;
        margin-left: 10px;
        margin-top: 10px;
        }
    & > :nth-child(2) {
        grid-area: icon;
        justify-self: center;
        padding-top: 30px;
    }
    & > :nth-child(3) {
        grid-area: labl;
        justify-self: center;
        font-weight: bold;
    }
    & > :nth-child(4) {
        grid-area: desc;
        justify-self: center;
        padding: 0 30px;
    }
    & > :nth-child(5) {
        grid-area: sta1;
        padding: 0 30px;
        font-weight: bold;
        margin-top: 12px;
    }
    & > :nth-child(6) {
        grid-area: val1;
        padding: 0 30px;
        margin-top: -12px;
    }
    & > :nth-child(7) {
        grid-area: sta2;
        font-weight: bold;
        margin-top: 12px;
        padding: 0 10px;
    }
    & > :nth-child(8) {
        grid-area: val2;
        padding: 0 10px;
        margin-top: -12px;
    }
    & > :nth-child(9) {
        grid-area: addr;
        padding: 0 30px;
        text-decoration: underline;
    }
`

const StyledMenuItem = styled(ContextMenuItem)
.attrs({
    iconColor: props =>
        props.colors.iconColor || textPrimary,
    labelColor: props =>
        props.colors.labelColor || props.colors.iconColor
})`
    color: ${props => props.labelColor}
    font-weight: bold;
    width: 248px;
    & > :first-child {
        margin-right: 15px;
        color: ${props => props.iconColor};
    }
`

export default ToolCard
