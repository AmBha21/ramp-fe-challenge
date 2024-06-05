import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, loading: employeesLoading, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    { /* BUG 7: Deleted the invalidate data */}
    // transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  // BUG 3: added a fetchAll for when the employeeId is EMPTY_EMPLOYEE.id
  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      if (employeeId === EMPTY_EMPLOYEE.id) {
        transactionsByEmployeeUtils.invalidateData();
        await paginatedTransactionsUtils.fetchAll();
      } else {
        paginatedTransactionsUtils.invalidateData();
        await transactionsByEmployeeUtils.fetchById(employeeId);
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  // BUG 5: Modified the useEffect and isLoading={employeesLoading}
  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions();
    }
  }, [employeesLoading, employees, loadAllTransactions]);  

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            } else if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions();
            } else {
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          {/* BUG 6: Added a check for paginatedTransactions.data */}
          {transactions !== null &&
            paginatedTransactions?.nextPage !== null &&
            paginatedTransactions?.data && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions();
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}
