export const EXCHANGES = {
  INTERNAL: 'internal.exchange',
  OUTBOUND: 'pharmacy.exchange',
  INBOUND: 'pharmacy.exchange',
  AUDIT: 'pharmacy.exchange',
};

export const QUEUES = {
  INTERNAL_PROCESSING: 'internal.processing.queue',
  SPRING_INCOMING: 'pharmacy.incoming.queue',
  NEST_INCOMING: 'pharmacy.outgoing.queue',
  AUDIT: 'audit.queue',
};

export const ROUTING_KEYS = {
  INTERNAL_EVENT: 'internal.event',
  SPRING_EVENT: 'pharmacy.incoming',
  NEST_EVENT: 'pharmacy.outgoing',
  AUDIT_EVENT: 'audit',
};
