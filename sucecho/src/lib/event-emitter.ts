// sucecho/src/lib/event-emitter.ts
import { EventEmitter } from 'events';

// This is a singleton pattern. No matter where we import this file from,
// we will always get the same instance of the EventEmitter.
// This is crucial for our real-time system to work correctly.
const eventEmitter = new EventEmitter();

export default eventEmitter;