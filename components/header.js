import React from 'react';
import { Menu, Icon, Label } from 'semantic-ui-react';
import { Link } from '../routes';

const Header = () => {
    return (
        <Menu
            stackable
            style={{
                marginTop: '0px',
                borderRadius: '14px',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
            }}
        >
            <Link legacyBehavior route="/">
                <a className="item">
                    <Icon name="ticket" color="violet" />
                    EventCoin
                    <Label color="black" size="mini" style={{ marginLeft: '8px' }}>E-Commerce</Label>
                </a>
            </Link>
        </Menu>
    );
};

export default Header;
