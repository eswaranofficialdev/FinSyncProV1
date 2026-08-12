
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';


import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaUsers,
  FaLock,
} from 'react-icons/fa';


import api from '../services/api';
import Modal from '../components/Modal';
import './listPage.css';


const CATEGORIES = [
  'Salary',
  'Shopping',
  'Bills',
  'Travel',
  'Health',
  'Education',
  'Investment',
  'Loan',
  'Savings',
  'Food',
  'Rent',
  'Entertainment',
  'Others',
];


const TYPES = [
  'income',
  'expense',
  'investment',
  'loan',
  'savings',
];


const PAYMENT_MODES = [
  'Cash',
  'Card',
  'UPI',
  'Bank Transfer',
  'Wallet',
  'Other',
];

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();


  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);


  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

 
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    onConfirm: () => {},
  });

  const confirm = (message, onConfirm, title = 'Are you sure?') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };


  const [search, setSearch] = useState(
    searchParams.get('search') || ''
  );


  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');


  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);


  const [submitting, setSubmitting] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
  });



  const fetchTransactions = useCallback(async () => {
    setLoading(true);


    try {
      const { data } = await api.get('/transactions', {
        params: {
          search,
          type: typeFilter || undefined,
          page,
          limit: 8,
        },
      });


      let rows = data.data;


      if (sourceFilter === 'personal') {
        rows = rows.filter((t) => !t.community);
      }


      if (sourceFilter === 'community') {
        rows = rows.filter((t) => !!t.community);
      }


      setTransactions(rows);
      setPages(data.meta.pages);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, sourceFilter, page]);


  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);


  useEffect(() => {
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }



  }, [search]);


  const openCreate = () => {
    setEditing(null);


    reset({
      type: 'expense',
      category: 'Others',
      amount: '',
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
      paymentMode: 'Cash',
    });


    setModalOpen(true);
  };


  const openEdit = (txn) => {
    if (txn.community) return;


    setEditing(txn);


    reset({
      type: txn.type,
      category: txn.category,
      amount: txn.amount,
      date: dayjs(txn.date).format('YYYY-MM-DD'),
      description: txn.description,
      paymentMode: txn.paymentMode,
    });


    setModalOpen(true);
  };


  const onSubmit = async (formData) => {
    if (submitting) return;


    setSubmitting(true);


    try {
      if (editing) {
        await api.put(
          `/transactions/${editing._id}`,
          formData
        );


        toast.success('Transaction updated');
      } else {
        await api.post(
          '/transactions',
          formData
        );


        toast.success('Transaction created');
      }


      setModalOpen(false);


      fetchTransactions();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to save transaction'
      );
    } finally {
      setSubmitting(false);
    }
  };


  const onDelete = async (txn) => {
    if (txn.community) return;


    confirm(
      'Delete this transaction?',
      async () => {
        try {
          await api.delete(`/transactions/${txn._id}`);
          toast.success('Transaction deleted');
          fetchTransactions();
        } catch (err) {
          toast.error('Failed to delete transaction');
        }
      },
      'Delete Transaction'
    );
  };


  return (
    <div>

      <div className="page-title-row">
        <div>
          <h1>Transactions</h1>


          <p className="page-subtitle">
            Track every income, expense, and investment
          </p>
        </div>


        <motion.button
          className="btn btn-primary"
          onClick={openCreate}
          whileTap={{ scale: 0.96 }}
        >
          <FaPlus />


          Add Transaction
        </motion.button>
      </div>

      <div className="glass-card filter-bar">


        <div
          className="navbar-search"
          style={{ maxWidth: 320 }}
        >
          <FaSearch />


          <input
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>



        <select
          className="form-input"
          style={{ maxWidth: 180 }}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            All Types
          </option>


          {TYPES.map((t) => (
            <option
              key={t}
              value={t}
            >
              {t}
            </option>
          ))}
        </select>



        <select
          className="form-input"
          style={{ maxWidth: 180 }}
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            Personal + Community
          </option>


          <option value="personal">
            Personal only
          </option>


          <option value="community">
            Community only
          </option>
        </select>


      </div>


      <motion.div
        className="glass-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: 20,
          marginTop: 16,
        }}
      >


        <div className="table-wrap">


          <table>


            <thead>
              <tr>
                <th>Txn #</th>
                <th>Description</th>
                <th>Source</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>



            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (


                

                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    No transactions found
                  </td>
                </tr>


              ) : (


                /* TRANSACTIONS */


                transactions.map((t) => (


                  <tr key={t._id}>


                    <td data-label="Txn #">
                      {t.transactionNumber}
                    </td>



                    <td data-label="Description">
                      {t.description || '-'}
                    </td>



                    <td data-label="Source">


                      {t.community ? (


                        <span
                          className="badge badge-warning"
                          title="Shared community expense"
                        >
                          <FaUsers
                            style={{
                              marginRight: 4,
                          }}
                        />


                          {t.community.name}
                        </span>


                      ) : (


                        <span className="badge badge-info">


                          <FaLock
                            style={{
                              marginRight: 4,
                          }}
                        />


                          Personal


                        </span>


                      )}


                    </td>



                    <td data-label="Category">
                      {t.category}
                    </td>



                    <td data-label="Type">


                      <span
                        className={`badge ${t.type === 'income'
                            ? 'badge-success'
                            : 'badge-danger'
                          }`}
                      >


                        {t.type === 'income'
                          ? <FaArrowUp />
                          : <FaArrowDown />
                        }


                        {t.type}


                      </span>


                    </td>



                    <td data-label="Amount">
                      <span
                        className="amount-cell"
                        title={`₹${Number(t.amount).toLocaleString('en-IN')}`}
                      >
                        ₹{Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </td>



                    <td data-label="Date">
                      {dayjs(t.date).format(
                        'DD MMM YYYY, hh:mm A'
                      )}
                    </td>



                    <td data-label="Actions">


                      {t.community ? (


                        <Link
                          to="/community"
                          className="btn btn-outline"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                        }}
                        >
                          View in Community
                        </Link>


                      ) : (


                        <>
                          <button
                            className="icon-btn"
                            onClick={() =>
                              openEdit(t)
                            }
                          >
                            <FaEdit />
                          </button>


                          <button
                            className="icon-btn"
                            onClick={() =>
                              onDelete(t)
                            }
                          >
                            <FaTrash />
                          </button>
                        </>


                      )}


                    </td>


                  </tr>


                ))


              )}


            </tbody>


          </table>


        </div>


        {pages > 1 && (


          <div className="pagination">


            {Array.from(
              { length: pages },
              (_, i) => (


                <button
                  key={i}
                  className={`page-btn ${page === i + 1
                      ? 'active'
                      : ''
                    }`}
                  onClick={() =>
                    setPage(i + 1)
                  }
                >
                  {i + 1}
                </button>


              )
            )}


          </div>


        )}


      </motion.div>


      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editing
            ? 'Edit Transaction'
            : 'Add Transaction'
        }


        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() =>
                setModalOpen(false)
              }
            >
              Cancel
            </button>


            <button
              className="btn btn-primary"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editing
                  ? 'Update'
                  : 'Create'
              }
            </button>
          </>
        }
      >


        <form
          onSubmit={handleSubmit(onSubmit)}
        >

          <div className="form-group">


            <label className="form-label">
              Type
            </label>


            <select
              className="form-input"
              {...register('type', {
                required: 'Type is required',
              })}
            >


              {TYPES.map((t) => (


                <option
                  key={t}
                  value={t}
                >
                  {t}
                </option>


              ))}


            </select>


            {errors.type && (
              <span className="form-error">
                {errors.type.message}
              </span>
            )}


          </div>



          <div className="form-group">


            <label className="form-label">
              Category
            </label>


            <select
              className="form-input"
              {...register('category')}
            >


              {CATEGORIES.map((c) => (


                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>


              ))}


            </select>


          </div>


          <div className="form-group">


            <label className="form-label">
              Amount
            </label>


            <input
              className="form-input"
              type="number"
              step="0.01"
              {...register('amount', {
                required: 'Amount is required',


                min: {
                  value: 0.01,
                  message: 'Must be greater than 0',
                },


                maxLength: {
                  value: 8,
                  message: 'Maximum 8 digits',
                },
              })}
            />


            {errors.amount && (
              <span className="form-error">
                {errors.amount.message}
              </span>
            )}


          </div>



          <div className="form-group">


            <label className="form-label">
              Date
            </label>


            <input
              className="form-input"
              type="date"
              {...register('date', {
                required: 'Date is required',
              })}
            />


            {errors.date && (
              <span className="form-error">
                {errors.date.message}
              </span>
            )}


          </div>

          <div className="form-group">


            <label className="form-label">
              Payment Mode
            </label>


            <select
              className="form-input"
              {...register('paymentMode')}
            >


              {PAYMENT_MODES.map((p) => (


                <option
                  key={p}
                  value={p}
                >
                  {p}
                </option>


              ))}


            </select>


          </div>


          <div className="form-group">


            <label className="form-label">
              Description
            </label>


            <textarea
              className="form-input"
              rows="3"
              placeholder="Enter transaction description..."
              {...register('description', {


                maxLength: {
                  value: 50,
                  message:
                    'Maximum 50 characters',
                },


                validate: (value) => {


                  const text = value?.trim() || '';


                  if (!text) {
                    return true;
                  }


                  const hasLongWord =
                    /\S{20,}/.test(text);


                  if (hasLongWord) {
                    return 'Please add spaces between words.';
                  }


                  return true;
                },
              })}
            />


            {/* DESCRIPTION ERROR */}


            {errors.description && (
              <span className="form-error">
                {errors.description.message}
              </span>
            )}


          </div>


        </form>


      </Modal>

      <Modal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmConfig.title}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmConfig.onConfirm}
            >
              Confirm
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main, #333)', lineHeight: 1.5 }}>
          {confirmConfig.message}
        </p>
      </Modal>


    </div>
  );
};



export default Transactions;