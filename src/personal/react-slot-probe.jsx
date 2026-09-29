import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export default {
  async mount(container, ctx) {
    const root = createRoot(container);
    const { site } = await ctx.data;
    flushSync(() => root.render(<p>{site.name}</p>));
    return { destroy() { root.unmount(); } };
  },
};
