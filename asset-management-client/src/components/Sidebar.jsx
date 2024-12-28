import React from "react";
import { Layout, Menu } from "antd";
import {
  DesktopOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    {
      key: "/",
      icon: <DesktopOutlined />,
      label: "资产管理",
    },
    {
      key: "/categories",
      icon: <TagOutlined />,
      label: "分类管理",
    },
  ];

  // 只有管理员可以看到用户管理
  if (user?.role === "admin") {
    items.push({
      key: "/users",
      icon: <UserOutlined />,
      label: "用户管理",
    });
  }

  return (
    <Sider>
      <div
        style={{
          height: 32,
          margin: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        资产管理系统
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default Sidebar; 