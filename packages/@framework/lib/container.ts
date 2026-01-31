/**
 * @fileoverview Lightweight dependency injection container with lifecycle management.
 * Provides explicit service registration via factory functions - no reflection or magic.
 */

import type { Service, ServiceMap } from './types';

/**
 * Factory function for creating a service instance.
 * Receives the container for resolving dependencies.
 *
 * @typeParam T - The service type being created
 * @typeParam S - The current service map type
 */
export type ServiceFactory<T, S extends ServiceMap> = (
  container: Container<S>
) => T;

/**
 * Service registration options
 */
export interface ServiceOptions {
  /**
   * If true, create a new instance on each get() call.
   * Default is false (singleton - single instance reused).
   */
  transient?: boolean;
}

/**
 * Dependency injection container interface.
 * Manages service registration, resolution, and lifecycle.
 *
 * @typeParam S - Service map type tracking registered services
 *
 * @example
 * ```typescript
 * const container = createContainer()
 *   .register('config', () => ({ port: 3001, dbPath: './data.db' }))
 *   .register('db', (c) => new DatabaseService(c.get('config').dbPath))
 *   .register('cards', (c) => new CardsService(c.get('db')));
 *
 * await container.start();
 * const cardsService = container.get('cards');
 * ```
 */
export interface Container<S extends ServiceMap = ServiceMap> {
  /**
   * Register a service factory.
   *
   * @param name - Unique service identifier
   * @param factory - Factory function that creates the service
   * @param options - Registration options (singleton vs transient)
   * @returns Container with updated type including the new service
   *
   * @example
   * ```typescript
   * container.register('db', () => new DatabaseService());
   * container.register('cards', (c) => new CardsService(c.get('db')));
   * ```
   */
  register<K extends string, T>(
    name: K,
    factory: ServiceFactory<T, S>,
    options?: ServiceOptions
  ): Container<S & Record<K, T>>;

  /**
   * Get a registered service instance.
   * For singletons, returns the cached instance (creating if needed).
   * For transient services, creates a new instance each call.
   *
   * @param name - Service identifier
   * @returns The service instance
   * @throws Error if service is not registered
   */
  get<K extends keyof S>(name: K): S[K];

  /**
   * Check if a service is registered.
   *
   * @param name - Service identifier
   */
  has(name: string): boolean;

  /**
   * Start all services that implement the Service interface.
   * Calls start() methods in registration order.
   * Should be called before the server starts listening.
   */
  start(): Promise<void>;

  /**
   * Stop all services that implement the Service interface.
   * Calls stop() methods in reverse registration order.
   * Should be called during graceful shutdown.
   */
  stop(): Promise<void>;

  /**
   * Get the service map for injecting into Context.
   * Returns a lazy proxy that resolves services on access.
   */
  readonly services: S;
}

/** Internal registration record */
interface Registration<S extends ServiceMap> {
  factory: ServiceFactory<unknown, S>;
  options: ServiceOptions;
}

/**
 * Create a new service container.
 *
 * The container uses explicit factory functions for dependency injection,
 * avoiding reflection and keeping the dependency graph visible in code.
 *
 * @returns Empty container ready for service registration
 *
 * @example
 * ```typescript
 * const container = createContainer()
 *   .register('db', () => new DatabaseService())
 *   .register('cards', (c) => new CardsService(c.get('db')));
 *
 * // Start services (calls start() on services that have it)
 * await container.start();
 *
 * // Access services
 * const cards = container.get('cards');
 *
 * // Shutdown (calls stop() in reverse order)
 * await container.stop();
 * ```
 */
export function createContainer(): Container<{}> {
  /** Registered service factories */
  const factories = new Map<string, Registration<any>>();

  /** Cached singleton instances */
  const instances = new Map<string, unknown>();

  /** Registration order for lifecycle management */
  const registrationOrder: string[] = [];

  /** Proxy for lazy service access */
  let servicesProxy: ServiceMap | null = null;

  const container: Container<any> = {
    register(name, factory, options = {}) {
      if (factories.has(name)) {
        throw new Error(`Service '${name}' is already registered`);
      }

      factories.set(name, { factory, options });
      registrationOrder.push(name);

      // Invalidate proxy cache
      servicesProxy = null;

      return container;
    },

    get(name: string | number | symbol) {
      const key = String(name);

      // Return cached singleton if available
      if (instances.has(key)) {
        return instances.get(key);
      }

      const registration = factories.get(key);
      if (!registration) {
        throw new Error(`Service '${key}' is not registered`);
      }

      // Create instance
      const instance = registration.factory(container);

      // Cache if singleton (not transient)
      if (!registration.options.transient) {
        instances.set(key, instance);
      }

      return instance;
    },

    has(name) {
      return factories.has(name);
    },

    async start() {
      for (const name of registrationOrder) {
        const instance = container.get(name);

        // Check if instance implements Service interface with start()
        if (isService(instance) && instance.start) {
          await instance.start();
        }
      }
    },

    async stop() {
      // Stop in reverse registration order
      const reversed = [...registrationOrder].reverse();

      for (const name of reversed) {
        // Only stop instantiated singletons
        const instance = instances.get(name);

        if (instance && isService(instance) && instance.stop) {
          await instance.stop();
        }
      }

      // Clear instance cache
      instances.clear();
    },

    get services() {
      if (servicesProxy) {
        return servicesProxy;
      }

      // Create lazy proxy for service access
      servicesProxy = new Proxy({} as ServiceMap, {
        get(_, prop) {
          if (typeof prop === 'string') {
            return container.get(prop);
          }
          return undefined;
        },

        has(_, prop) {
          if (typeof prop === 'string') {
            return container.has(prop);
          }
          return false;
        },

        ownKeys() {
          return Array.from(factories.keys());
        },

        getOwnPropertyDescriptor(_, prop) {
          if (typeof prop === 'string' && factories.has(prop)) {
            return {
              enumerable: true,
              configurable: true,
              get: () => container.get(prop)
            };
          }
          return undefined;
        }
      });

      return servicesProxy;
    }
  };

  return container;
}

/**
 * Type guard to check if a value implements the Service interface
 */
function isService(value: unknown): value is Service {
  return (
    value !== null &&
    typeof value === 'object' &&
    ('start' in value || 'stop' in value)
  );
}
