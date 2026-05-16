export const EXCHANGES = {
  INTERNAL: 'internal.exchange',
  OUTBOUND: 'pharmacy.exchange',
  INBOUND: 'pharmacy.exchange',
};

export const QUEUES = {
  INTERNAL_PROCESSING: 'internal.processing.queue',
  SPRING_INCOMING: 'pharmacy.incoming.queue',
  NEST_INCOMING: 'pharmacy.outgoing.queue',
};

export const ROUTING_KEYS = {
  INTERNAL_EVENT: 'internal.event',
  SPRING_EVENT: 'pharmacy.incoming',
  NEST_EVENT: 'pharmacy.outgoing',
};
