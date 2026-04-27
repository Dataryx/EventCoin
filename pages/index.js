import React from 'react';
import { Card, Button, Icon, Segment, Header, Grid, List } from 'semantic-ui-react';
import Layout from '../components/layout';
import { Link } from '../routes';

const LoginPortal = () => {
    const items = [
        {
            header: 'Admin Portal',
            description: (
                <div>
                    <p>Create events, manage tickets, and validate QR tickets.</p>
                    <Link route="/admin/login" legacyBehavior>
                        <a>
                            <Button primary icon labelPosition="left">
                                <Icon name="user secret" />
                                Login as Admin
                            </Button>
                        </a>
                    </Link>
                </div>
            )
        },
        {
            header: 'Client Portal',
            description: (
                <div>
                    <p>Explore events, purchase tickets, and view QR tickets instantly.</p>
                    <Link route="/client/login" legacyBehavior>
                        <a>
                            <Button color="teal" icon labelPosition="left">
                                <Icon name="user" />
                                Login as Client
                            </Button>
                        </a>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <Layout>
            <Segment
                padded="very"
                style={{
                    borderRadius: '18px',
                    border: '1px solid #1e293b',
                    boxShadow: '0 10px 28px rgba(30, 41, 59, 0.18)',
                    backgroundImage:
                        "linear-gradient(95deg, rgba(15, 23, 42, 0.88), rgba(30, 27, 75, 0.68)), url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#f8fafc'
                }}
            >
                <Grid stackable columns={2} verticalAlign="middle">
                    <Grid.Column>
                        <Header as="h1" style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
                            EventCoin Commerce Hub
                        </Header>
                        <p style={{ color: '#cbd5e1', fontSize: '1.05rem' }}>
                            A full event ticketing commerce platform with role-based portals, checkout, QR tickets, and validation.
                        </p>
                        <List bulleted>
                            <List.Item>Modern client storefront with checkout flow</List.Item>
                            <List.Item>Admin command center for event operations</List.Item>
                            <List.Item>QR-based ticket issuance and validation</List.Item>
                        </List>
                    </Grid.Column>
                    <Grid.Column>
                        <Segment color="violet" secondary>
                            <Header as="h4">Quick Start</Header>
                            <p>Select your role below to enter your dedicated portal.</p>
                        </Segment>
                    </Grid.Column>
                </Grid>
            </Segment>
            <Card.Group itemsPerRow={2} stackable>
                {items.map((item) => (
                    <Card key={item.header} style={{ borderRadius: '16px' }}>
                        <Card.Content>
                            <Card.Header>{item.header}</Card.Header>
                            <Card.Description style={{ marginTop: '12px' }}>
                                {item.description}
                            </Card.Description>
                        </Card.Content>
                    </Card>
                ))}
            </Card.Group>
        </Layout>
    );
};

export default LoginPortal;
