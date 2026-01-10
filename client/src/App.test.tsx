import {render, screen} from '@testing-library/react';
import App from './App';

// if we care someday we can get types for jest or whatever
declare global {
  var test: any, expect: any;
}

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
