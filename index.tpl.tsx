import { PageHeaderWrapper } from "@ant-design/pro-layout";
import type { ProColumns } from "@ant-design/pro-table";
import ProTable from "@ant-design/pro-table";
import type { RootObject } from "./data";
import FormattedMessage from '@/components/FormattedMessage/FormattedMessage';
const mock = () => {
  return { data: { records: [] , total: 0} };
};
export default () => {
  /** columns **/

  return (
    <PageHeaderWrapper>
      <ProTable<RootObject>
        manualRequest={true}
        className="AllCustomer"
        rowKey="key"
        columns={columns}
        request={async (params) => {
          const res = await mock(params);
          const data = res.data;
          return {
            total: data.total,
            data: data.records,
          };
        }}
        pagination={{ showSizeChanger: true }}
      />
    </PageHeaderWrapper>
  );
};
