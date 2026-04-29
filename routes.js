const routes = require('next-routes')();

routes
    .add('/admin', '/admin/login')
    .add('/admin/login', '/admin/login')
    .add('/admin/dashboard', '/admin/dashboard')
    .add('/admin/events', '/admin/events')
    .add('/admin/ticket-validation', '/admin/ticket-validation')
    .add('/admin/clients', '/admin/clients')
    .add('/admin/revenue', '/admin/revenue')
    .add('/admin/payouts', '/admin/payouts')
    .add('/admin/invoices', '/admin/invoices')
    .add('/admin/integrations', '/admin/integrations')
    .add('/admin/audit-logs', '/admin/audit-logs')
    .add('/admin/settings', '/admin/settings')
    .add('/client/login', '/client/login')
    .add('/client/dashboard', '/client/dashboard')
    .add('/client/tickets', '/client/tickets')
    .add('/client/ticket/:eventAddress/:ticketId', '/client/ticket')
    .add('/events/new', '/events/new')
    .add('/events/:address', '/events/show')
    .add('/events/:address/client', '/events/clientShow')
    .add('/events/:address/validate', '/events/owners/validateTicket')
    .add('/events/:address/owners', '/events/owners/index')
    .add('/events/:address/useTicket', '/events/owners/useTicket')
    .add('/events/:address/refundTicket', 'events/owners/refundTicket')
    .add('/events/:address/transferTicket', 'events/owners/transferTicket');

module.exports = routes;
