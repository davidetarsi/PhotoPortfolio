import { describe, it, expect } from 'vitest';
import { topBarHtml } from './top-bar.js';

describe('topBarHtml', () => {
  it('showBackLink:true include il link "Tutti gli album"', () => {
    const container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: true });
    expect(container.querySelector('.admin-back')).not.toBeNull();
  });

  it('showBackLink:false non include il link', () => {
    const container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: false });
    expect(container.querySelector('.admin-back')).toBeNull();
  });
});
