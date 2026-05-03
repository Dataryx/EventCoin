import React from 'react';
import { useRouter } from 'next/router';
import { Menu, Icon, Label } from 'semantic-ui-react';
import { Link } from '../routes';

const Header = () => {
    const router = useRouter();
    const currentPath = router.asPath || router.pathname || '/';

    const resolveBrandRoute = () => {
        if (currentPath.startsWith('/admin')) {
            return '/admin/dashboard';
        }

        if (currentPath.startsWith('/client')) {
            return '/client/dashboard';
        }

        if (currentPath.startsWith('/events/')) {
            if (currentPath.includes('/client') || currentPath.includes('/checkout')) {
                return '/client/dashboard';
            }

            return '/admin/dashboard';
        }

        return '/';
    };

    const brandRoute = resolveBrandRoute();

    return (
        <Menu
            stackable
            style={{
                marginTop: '0px',
                borderRadius: '18px',
                padding: '10px 12px',
                border: '1px solid #dbeafe',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)'
            }}
        >
            <Link legacyBehavior route={brandRoute}>
                <a className="item">
                    <Icon name="ticket" color="blue" />
                    EventCoin
                    <Label
                        color="blue"
                        size="mini"
                        style={{
                            marginLeft: '8px',
                            borderRadius: '999px',
                            letterSpacing: '0.08em'
                        }}
                    >
                        Tickets
                    </Label>
                </a>
            </Link>
        </Menu>
    );
};

export default Header;
