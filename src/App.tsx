/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import * as todosApi from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([] as Todo[]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([] as Todo[]);
  const [query, setQuery] = useState<string>('');
  const [leftItems, setLeftItems] = useState<number>(0);
  const [todoStatus, setTodoStatus] = useState<boolean>(false);
  const [edditingTodo, setEdditingTodo] = useState<number>();
  const [edditingTodoTitle, setEdditingTodoTitle] = useState<string>('');
  const [currentCreatedTodo, setCurrentCreatedTodo] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    todosApi
      .getTodos()
      .then(fetchedTodos => {
        setTodos(fetchedTodos);
        setLeftItems(
          fetchedTodos.filter(todoToCount => !todoToCount.completed).length,
        );
      })
      .catch(() => {
        setError('Unable to load todos');
        setTimeout(() => {
          setError('');
        }, 3000);
      });
  }, []);

  useEffect(() => {
    setFilteredTodos(todos);
    setLeftItems(
      [...todos].filter(todoToCount => !todoToCount.completed).length,
    );
  }, [todos]);

  useEffect(() => {
    if (query === 'active') {
      setFilteredTodos(
        [...todos].filter(todoToFilter => !todoToFilter.completed),
      );
    } else if (query === 'completed') {
      setFilteredTodos(
        [...todos].filter(todoToFilter => todoToFilter.completed),
      );
    } else if (query === '') {
      setFilteredTodos(todos);
    }
  }, [query]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [edditingTodo]);

  const reset = () => {
    setCurrentCreatedTodo('');
  };

  const handleToBlur = (currentTodoItem: Todo) => {
    setEdditingTodo(undefined);
    todosApi
      .updateTodo(
        currentTodoItem.id,
        currentTodoItem.completed,
        edditingTodoTitle,
      )
      .then(updatedTodo => {
        setTodoStatus(true);
        const newTodos = [...todos];
        const index = newTodos.findIndex(todoo => todoo.id === updatedTodo.id);

        newTodos.splice(index, 1, updatedTodo);
        setTodos(newTodos);

        return newTodos;
      })
      .catch(() => {
        setError('Unable to update a todo');
        setTimeout(() => {
          setError('');
        }, 3000);
      })
      .finally(() => {
        setTodoStatus(false);
      });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          <form>
            <input
              data-cy="NewTodoField"
              type="text"
              value={currentCreatedTodo}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={e => {
                setCurrentCreatedTodo(e.currentTarget.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTodo: Omit<Todo, 'id'> = {
                    userId: USER_ID,
                    title: e.currentTarget.value.trim(),
                    completed: false,
                  };

                  todosApi
                    .addTodo(newTodo)
                    .then(addedTodo => {
                      setTodos(prevTodos => [...prevTodos, addedTodo]);
                    })
                    .catch(() => {
                      setError('Unable to add a todo');
                      setTimeout(() => {
                        setError('');
                      }, 3000);
                    })
                    .finally(() => {
                      reset();
                    });
                } else if (e.key === 'Enter') {
                  setError('Title should not be empty');
                  setTimeout(() => {
                    setError('');
                  }, 3000);
                }
              }}
            />
          </form>
        </header>
        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todoToMap => (
            <div
              data-cy="Todo"
              className={`todo ${todoToMap.completed ? 'completed' : ''}`}
              key={todoToMap.id}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todoToMap.completed}
                  onChange={() => {
                    todosApi
                      .updateTodo(
                        todoToMap.id,
                        !todoToMap.completed,
                        todoToMap.title,
                      )
                      .then(updatedTodo => {
                        setTodoStatus(true);
                        setTodos(prevTodos => {
                          return prevTodos.map(todoItem =>
                            todoItem.id === updatedTodo.id
                              ? updatedTodo
                              : todoItem,
                          );
                        });
                      })
                      .finally(() => {
                        setTodoStatus(false);
                      });
                  }}
                />
              </label>

              {edditingTodo === todoToMap.id ? (
                <form>
                  <input
                    ref={inputRef}
                    data-cy="TodoTitleField"
                    type="text"
                    className="todo__title-field"
                    placeholder="Empty todo will be deleted"
                    value={edditingTodoTitle}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleToBlur(todoToMap);
                      } else if (e.key === 'Enter') {
                        todosApi
                          .deleteTodo(todoToMap.id)
                          .then(() => {
                            setTodoStatus(true);
                          })
                          .catch(() => {
                            setError('Unable to delete a todo');
                            setFilteredTodos(todos);
                            setTimeout(() => {
                              setError('');
                            }, 3000);
                          })
                          .finally(() => {
                            setTodoStatus(false);
                            setTodos(prevTodos =>
                              prevTodos.filter(
                                todoItem => todoItem.id !== todoToMap.id,
                              ),
                            );
                          });
                      }
                    }}
                    onChange={e => {
                      setEdditingTodoTitle(e.currentTarget.value);
                    }}
                    onBlur={() => {
                      handleToBlur(todoToMap);
                      if (edditingTodoTitle.trim() === '') {
                        todosApi
                          .deleteTodo(todoToMap.id)
                          .then(() => {
                            setTodoStatus(true);
                          })
                          .catch(() => {
                            setError('Unable to delete a todo');
                            setFilteredTodos(todos);
                            setTimeout(() => {
                              setError('');
                            }, 3000);
                          })
                          .finally(() => {
                            setTodoStatus(false);
                            setTodos(prevTodos =>
                              prevTodos.filter(
                                todoItem => todoItem.id !== todoToMap.id,
                              ),
                            );
                          });
                      }
                    }}
                  />
                </form>
              ) : (
                <>
                  <span
                    data-cy="TodoTitle"
                    className="todo__title"
                    onDoubleClick={() => {
                      setEdditingTodo(todoToMap.id);
                      setEdditingTodoTitle(todoToMap.title);
                    }}
                  >
                    {todoToMap.title}
                  </span>

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => {
                      todosApi
                        .deleteTodo(todoToMap.id)
                        .then(() => {
                          setTodoStatus(true);
                        })
                        .catch(() => {
                          setError('Unable to delete a todo');
                          setFilteredTodos(todos);
                          setTimeout(() => {
                            setError('');
                          }, 3000);
                        })
                        .finally(() => {
                          setTodoStatus(false);
                          setTodos(prevTodos =>
                            prevTodos.filter(
                              todoItem => todoItem.id !== todoToMap.id,
                            ),
                          );
                        });
                    }}
                  >
                    ×
                  </button>
                </>
              )}

              <div
                data-cy="TodoLoader"
                className={`modal overlay ${todoStatus ? 'is-active' : ''}`}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
        </section>
        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {leftItems} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${query === '' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setQuery('')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${query === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setQuery('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${query === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setQuery('completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => {
                todos.map(todoItem => {
                  if (todoItem.completed) {
                    todosApi
                      .deleteTodo(todoItem.id)
                      .then(() => {
                        setTodos(
                          todos.filter(
                            filteredTodoItem => !filteredTodoItem.completed,
                          ),
                        );
                      })
                      .catch(() => {
                        setError('Unable to delete a todo');
                        setTimeout(() => {
                          setError('');
                        }, 3000);
                      });
                  }
                });
              }}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${error ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => {
            setError('');
          }}
        />
        {error}
      </div>
    </div>
  );
};
