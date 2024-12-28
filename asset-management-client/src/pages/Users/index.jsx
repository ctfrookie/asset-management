import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Space,
} from "antd";
import request from "../../utils/request";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  const fetchUsers = async () => {
    try {
      const data = await request.get("/users");
      setUsers(data);
    } catch (error) {
      message.error("获取用户列表失败");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (values) => {
    try {
      if (editingId) {
        await request.put(`/users/${editingId}`, values);
        message.success("更新成功");
      } else {
        await request.post("/users", values);
        message.success("添加成功");
      }
      setVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error || "操作失败");
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      password: undefined, // 不显示密码
    });
    setVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await request.delete(`/users/${id}`);
      message.success("删除成功");
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error || "删除失败");
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await request.post("/users/change-password", values);
      message.success("密码修改成功");
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "密码修改失败");
    }
  };

  const columns = [
    { title: "用户名", dataIndex: "username" },
    { title: "真实姓名", dataIndex: "real_name" },
    {
      title: "角色",
      dataIndex: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "管理员" : "普通用户"}
        </Tag>
      ),
    },
    { title: "邮箱", dataIndex: "email" },
    { title: "电话", dataIndex: "phone" },
    { title: "部门", dataIndex: "department" },
    {
      title: "状态",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "正常" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "最后登录",
      dataIndex: "last_login",
      render: (date) => date ? new Date(date).toLocaleString() : "",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setVisible(true);
            }}
          >
            添加用户
          </Button>
          <Button onClick={() => setChangePasswordVisible(true)}>
            修改密码
          </Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={users} rowKey="id" />

      <Modal
        title={editingId ? "编辑用户" : "添加用户"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="real_name" label="真实姓名">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select>
              <Select.Option value="user">普通用户</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">正常</Select.Option>
              <Select.Option value="disabled">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          passwordForm.resetFields();
        }}
        onOk={() => passwordForm.submit()}
      >
        <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: "请输入旧密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: "请输入新密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users; 