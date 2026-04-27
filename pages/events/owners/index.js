import React, { Component } from 'react';
import { Card } from 'semantic-ui-react';
import Layout from '../../../components/layout';
import Event from '../../../ethereum/event';

class RequestIndex extends Component {
    static async getInitialProps(props) {
        const event = Event(props.query.address);
        const owners = await event.methods.getTicketOwners().call();

        return { owners };
    }

    renderOwners() {
        const items = this.props.owners.map(address => {
            return {
                header: address,
                fluid: true
            };
        });

        return <Card.Group items={items} />;
    }

    render() {
        return (
            <Layout>
                <h3>Owners</h3>
                {this.renderOwners()}
            </Layout>
        );
    }
}

export default RequestIndex;
