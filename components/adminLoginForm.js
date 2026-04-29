import React, { Component } from 'react';
import { Button, Form, Message } from 'semantic-ui-react';
import { Router } from '../routes';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin@123';

class AdminLoginForm extends Component {
    state = {
        username: '',
        password: '',
        loading: false,
        errorMessage: ''
    };

    onSubmit = async (event) => {
        event.preventDefault();
        this.setState({ loading: true, errorMessage: '' });

        const { username, password } = this.state;

        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            this.setState({
                loading: false,
                errorMessage: 'Invalid admin username or password.'
            });
            return;
        }

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('adminAccount', ADMIN_USERNAME);
            window.localStorage.setItem('adminAuthenticated', 'true');
        }

        if (this.props.onSuccess) {
            this.props.onSuccess();
        }

        await Router.pushRoute('/admin/dashboard');
        this.setState({ loading: false });
    };

    render() {
        const buttonLabel = this.props.buttonLabel || 'Log In';

        return (
            <Form
                className={this.props.className}
                onSubmit={this.onSubmit}
                error={!!this.state.errorMessage}
            >
                <Form.Input
                    label="Username"
                    placeholder="Enter admin username"
                    value={this.state.username}
                    onChange={(event) => this.setState({ username: event.target.value })}
                />
                <Form.Input
                    label="Password"
                    type="password"
                    placeholder="Enter admin password"
                    value={this.state.password}
                    onChange={(event) => this.setState({ password: event.target.value })}
                />
                <Button
                    primary={!this.props.buttonColor}
                    color={this.props.buttonColor}
                    fluid
                    size="large"
                    loading={this.state.loading}
                >
                    {buttonLabel}
                </Button>
                <Message error header="Login failed" content={this.state.errorMessage} />
            </Form>
        );
    }
}

export default AdminLoginForm;
