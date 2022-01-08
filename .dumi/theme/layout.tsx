import Layout from 'dumi-theme-default/es/layout';
import './layout.less';

export default ({ children, ...props }) => (
  <Layout {...props}>
    <>
      {children}
    </>
  </Layout>
);
