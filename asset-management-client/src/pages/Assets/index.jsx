import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, DatePicker, InputNumber, Upload, Checkbox } from "antd";
import request from "../../utils/request";
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [columnSettingsVisible, setColumnSettingsVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const savedSettings = localStorage.getItem('assetColumnSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      name: true,
      category_name: true,
      ip_address: true,
      port: true,
      status: true,
      location: true,
      add_date: true,
      purchase_price: true,
      current_value: true,
      remarks: true,
    };
  });

  const columnTitles = {
    name: "名称",
    category_name: "分类",
    ip_address: "IP地址",
    port: "端口",
    status: "状态",
    location: "位置",
    add_date: "添加日期",
    purchase_price: "购买价格",
    current_value: "当前价值",
    remarks: "备注",
  };

  const saveColumnSettings = (newSettings) => {
    localStorage.setItem('assetColumnSettings', JSON.stringify(newSettings));
    setVisibleColumns(newSettings);
  };

  const fetchAssets = async () => {
    try {
      const data = await request.get("/assets");
      setAssets(data || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setAssets([]);
      } else {
        message.error("获取资产列表失败");
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await request.get("/categories");
      setCategories(data);
    } catch (error) {
      message.error("获取分类列表失败");
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  const handleAdd = async (values) => {
    try {
      if (values.purchase_date) {
        values.purchase_date = values.purchase_date.format('YYYY-MM-DD');
      }

      if (editingId) {
        await request.put(`/assets/${editingId}`, values);
      } else {
        await request.post("/assets", values);
      }
      message.success(editingId ? "更新成功" : "添加成功");
      setVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchAssets();
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
      await request.delete(`/assets/${id}`);
      message.success("删除成功");
      fetchAssets();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleExport = async () => {
    try {
      const response = await request.get('/assets/export', {
        responseType: 'blob'
      });
      saveAs(new Blob([response]), 'assets.xlsx');
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleImport = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await request.post('/assets/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success('导入成功');
      fetchAssets();
    } catch (error) {
      message.error('导入失败');
    }
  };

  const columns = [
    { title: "名称", dataIndex: "name", hidden: !visibleColumns.name },
    { title: "分类", dataIndex: "category_name", hidden: !visibleColumns.category_name },
    { title: "IP地址", dataIndex: "ip_address", hidden: !visibleColumns.ip_address },
    { title: "端口", dataIndex: "port", hidden: !visibleColumns.port },
    { 
      title: "状态", 
      dataIndex: "status",
      hidden: !visibleColumns.status,
      render: (status) => {
        const statusMap = {
          in_use: "使用中",
          available: "可用",
          maintenance: "维护中",
          disposed: "已处置"
        };
        return statusMap[status] || status;
      }
    },
    { title: "位置", dataIndex: "location", hidden: !visibleColumns.location },
    { 
      title: "添加日期", 
      dataIndex: "add_date",
      hidden: !visibleColumns.add_date,
      render: (date) => date ? new Date(date).toLocaleDateString() : ""
    },
    { 
      title: "购买价格", 
      dataIndex: "purchase_price",
      hidden: !visibleColumns.purchase_price,
      render: (price) => price ? `¥${price}` : ""
    },
    { 
      title: "当前价值", 
      dataIndex: "current_value",
      hidden: !visibleColumns.current_value,
      render: (value) => value ? `¥${value}` : ""
    },
    { 
      title: "备注", 
      dataIndex: "remarks", 
      hidden: !visibleColumns.remarks,
      ellipsis: true 
    },
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
  ].filter(column => !column.hidden);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button type="primary" onClick={() => setVisible(true)}>
          添加资产
        </Button>
        <Upload
          showUploadList={false}
          beforeUpload={(file) => {
            handleImport(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>导入资产</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出资产
        </Button>
        <Button onClick={() => setColumnSettingsVisible(true)}>
          列设置
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={assets} 
        rowKey="id"
        scroll={{ x: true }}
      />

      <Modal
        title="列设置"
        open={columnSettingsVisible}
        onCancel={() => setColumnSettingsVisible(false)}
        onOk={() => setColumnSettingsVisible(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.keys(visibleColumns).map(key => (
            <Checkbox
              key={key}
              checked={visibleColumns[key]}
              onChange={e => saveColumnSettings({
                ...visibleColumns,
                [key]: e.target.checked
              })}
            >
              {columnTitles[key] || key}
            </Checkbox>
          ))}
        </div>
      </Modal>

      <Modal
        title={editingId ? "编辑资产" : "添加资产"}
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
            label="资产名称"
            rules={[{ required: true, message: "请输入资产名称" }]}
          >
            <Input placeholder="请输入资产名称" />
          </Form.Item>
          <Form.Item
            name="category_id"
            label="资产分类"
            rules={[{ required: true, message: "请选择资产分类" }]}
          >
            <Select placeholder="请选择资产分类">
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="in_use">使用中</Select.Option>
              <Select.Option value="available">可用</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
              <Select.Option value="disposed">已处置</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="purchase_date" label="购买日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="purchase_price" label="购买价格">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入购买价格"
              min={0}
              step={0.01}
            />
          </Form.Item>
          <Form.Item name="current_value" label="当前价值">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入当前价值"
              min={0}
              step={0.01}
            />
          </Form.Item>
          <Form.Item name="ip_address" label="IP地址">
            <Input placeholder="请输入IP地址" />
          </Form.Item>
          <Form.Item name="port" label="端口">
            <Input placeholder="请输入端口号，多个端口用逗号分隔" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea
              placeholder="请输入备注信息"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item name="add_date" label="添加日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Assets; 