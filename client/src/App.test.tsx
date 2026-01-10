import {render, screen} from '@testing-library/react';
import App from './App';

/* eslint-disable @typescript-eslint/no-explicit-any, vars-on-top, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access  */

// if we care someday we can get types for jest or whatever
declare global {
  var test: any;
  var expect: any;
}

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
