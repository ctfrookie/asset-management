import React from "react";
import { Layout, Button, Space } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import useAuth from "../hooks/useAuth";

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <AntHeader
      style={{
        padding: "0 16px",
        background: "#fff",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <Space>
        <span>
          <UserOutlined /> {user?.real_name || user?.username}
        </span>
        <Button
          type="link"
          icon={<LogoutOutlined />}
          onClick={logout}
        >
          退出
        </Button>
      </Space>
    </AntHeader>
  );
};

export default Header; 