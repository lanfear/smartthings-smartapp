import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren} from 'react';
import type {Nullable} from '../types/interfaces';

// minimal replacement for the unmaintained `react-sse-hooks` package: one shared EventSource per url,
// created on first use and closed when the provider unmounts

interface IEventSourceContext {
  getConnection: (url: string) => EventSource;
}

const EventSourceContext = createContext<Nullable<IEventSourceContext>>(null);

export const EventSourceProvider = ({children}: PropsWithChildren<object>): React.ReactElement => {
  const connections = useRef<Record<string, EventSource>>({});

  const getConnection = useCallback((url: string): EventSource => {
    connections.current[url] ??= new EventSource(url);
    return connections.current[url];
  }, []);

  useEffect(() => () => {
    Object.values(connections.current).forEach(connection => connection.close());
    connections.current = {};
  }, []);

  const contextValue = useMemo(() => ({getConnection}), [getConnection]);

  return (
    <EventSourceContext.Provider value={contextValue}>
      {children}
    </EventSourceContext.Provider>
  );
};

export const useEventSource = ({source, enabled = true}: {source: string; enabled?: boolean}): Nullable<EventSource> => {
  const context = useContext(EventSourceContext);
  if (!context) {
    throw new Error('useEventSource must be used inside an EventSourceProvider');
  }
  return enabled ? context.getConnection(source) : null;
};

export const useEventSourceListener = <T, >({source, event}: {
  source: Nullable<EventSource>;
  event: {
    name: string;
    listener: (message: {data: T}) => void;
  };
}): void => {
  const {name, listener} = event;

  // always call the latest listener without re-subscribing on every render
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!source) {
      return;
    }

    const handler = (message: MessageEvent<string>): void => {
      let data: T;
      try {
        data = JSON.parse(message.data) as T;
      } catch {
        return; // ignore non-json messages
      }
      listenerRef.current({data});
    };

    source.addEventListener(name, handler);
    return () => source.removeEventListener(name, handler);
  }, [source, name]);
};
