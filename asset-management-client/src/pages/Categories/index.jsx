import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import request from "../../utils/request";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const data = await request.get("/categories");
      setCategories(data || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setCategories([]);
      } else {
        message.error("获取分类列表失败");
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (values) => {
    try {
      if (editingId) {
        await request.put(`/categories/${editingId}`, values);
      } else {
        await request.post("/categories", values);
      }
      message.success(editingId ? "更新成功" : "添加成功");
      setVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      message.error(error.response?.data?.error || (editingId ? "更新失败" : "添加失败"));
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await request.delete(`/categories/${id}`);
      message.success("删除成功");
      fetchCategories();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const columns = [
    { title: "名称", dataIndex: "name" },
    { title: "描述", dataIndex: "description" },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <>
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
        </>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          setEditingId(null);
          form.resetFields();
          setVisible(true);
        }}
        style={{ marginBottom: 16 }}
      >
        添加分类
      </Button>
      <Table columns={columns} dataSource={categories} rowKey="id" />

      <Modal
        title={editingId ? "编辑分类" : "添加分类"}
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
            name="name"
            label="分类名称"
            rules={[{ required: true, message: "请输入分类名称" }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="description" label="分类描述">
            <Input.TextArea placeholder="请输入分类描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories; 