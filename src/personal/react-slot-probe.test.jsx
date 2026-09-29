import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createSlotResolver } from '../core/slots.js';
import probe from './react-slot-probe.jsx';

describe('personal React landing bridge', () => {
  afterEach(() => { delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

  it('mounts through the template slot and unmounts its React root', async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const resolve = createSlotResolver(
      { landing: { mount: () => ({ destroy() {} }) } },
      { landing: async () => ({ default: probe }) },
      { landing: 'mount' },
    );
    const landing = await resolve('landing');
    const container = document.createElement('div');
    let handle;

    await act(async () => {
      handle = await landing.mount(container, { data: Promise.resolve({ site: { name: 'Davide Tarsi' } }) });
    });
    expect(container.textContent).toBe('Davide Tarsi');

    await act(async () => { handle.destroy(); });
    expect(container.childElementCount).toBe(0);
  });
});
