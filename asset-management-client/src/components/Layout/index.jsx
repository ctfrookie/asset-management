import React from "react";
import { Layout, Menu } from "antd";
import { useNavigate, Outlet } from "react-router-dom";
import {
  DatabaseOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <div style={{ height: "32px", margin: "16px", color: "white" }}>
          资产管理系统
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["assets"]}>
          <Menu.Item key="assets" icon={<DatabaseOutlined />} onClick={() => navigate("/assets")}>
            资产管理
          </Menu.Item>
          <Menu.Item key="categories" icon={<AppstoreOutlined />} onClick={() => navigate("/categories")}>
            分类管理
          </Menu.Item>
          <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: "#fff" }} />
        <Content style={{ margin: "24px 16px", padding: 24, background: "#fff" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 