import React, { useState, useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import { fetchData, postData } from "../../api";
import { Form } from "react-bootstrap";
import Tag from "../basic-ui/Tag";
import faceFallback from '../../assets/images/faces/face1.jpg';

const BasicTable = () => {
  const [groupedEmployees, setGroupedEmployees] = useState({});
  const [selectedTag, setSelectedTag] = useState("");
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [toReset, setToReset] = useState(false);

  const handleTagClick = (label) => {
    setSelectedTag(label); // Update the state with the clicked tag's label
  };
  const handleImageError = (e) => {
    e.target.src = faceFallback;
  };

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await fetchData("employees");
        if (data && data.length > 0) {
          const grouped = groupEmployeesByCompany(data);
          setGroupedEmployees(grouped);
          console.log(grouped); // Log after state update
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    }

    fetchEmployees();
  }, [toReset]);

  const groupEmployeesByCompany = (employees) => {
    const groupedEmployees = {};
    employees.forEach((employee) => {
      if (!groupedEmployees[employee.company]) {
        groupedEmployees[employee.company] = [];
      }
      groupedEmployees[employee.company].push(employee);
    });
    return groupedEmployees;
  };
  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const formatSalary = (salary) => {
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(salary);
    return formatted.replace("IDR", "Rp ");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await postData('employee-ai/edit', { content: selectedTag });
      if (response.status === 200) {
        setNotification({ message: 'Successfully changed user data.', type: 'success' });
        setSelectedTag(''); // Reset form on success
        setToReset(!toReset); // Trigger useEffect to refetch data
      } else {
        setNotification({ message: 'Failed to submit the request. Please check your prompt again.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Failed to submit the request.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-memory"></i>
          </span>{" "}
          Employee.AI <small className="text-muted">Powered by Sakura.AI</small>
        </h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <Form.Group>
                <h5 htmlFor="exampleTextarea1">Prompt</h5>
                <ul className="list-star">
                  <li>Add employees</li>
                  <li>Edit data of employees</li>
                  <li>
                    Calculate and change base salary of employee based on
                    performance
                  </li>
                  <li>Promote an employee to a higher role and work hours</li>
                </ul>
                <ul className="list-ticked">
                  <li>Support multiple languages</li>
                  <li>Can multiple changes at the same time</li>
                </ul>

                <textarea
                  className="form-control"
                  id="exampleTextarea1"
                  rows="4"
                  value={selectedTag} // Bind textarea value to selectedTag state
                  onChange={(e) => setSelectedTag(e.target.value)} // Handle manual changes if needed
                ></textarea>

                {/* Tags with onClick handler */}
                <Tag
                  label="Tambah karyawan baru dengan nama Dimas, posisi manager dengan gaji 10 juta di sakura internal"
                  color="blue"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Promosi karyawan Nanda Purnama jadi Operasional dengan kenaikan gaji 4 juta dari sebelumnya"
                  color="purple"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Ubah data karyawan Putri email menjadi putri@gmail.com"
                  color="green"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Masukkan karyawan baru bernama Jack Black, email jack.black@example.com."
                  color="red"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Tambah progres sebesar 5 untuk semua karyawan di SSS Internal."
                  color="gray"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Perbarui jam kerja karyawan Kartika menjadi 50, serta email menjadi sarah@example.com."
                  color="purple"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Tolong masukkan karyawan baru: randy, email: randy@example.com, jabatan Manager."
                  color="green"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Add salary by 90000 and add progress by 2 for Oktavia Sari"
                  color="blue"
                  onClick={handleTagClick}
                />
                <br />
                <button className="btn btn-gradient-info mr-2 mt-4" disabled>
                  Preview
                </button>
                <button
                  type="button"
                  className="btn btn-gradient-primary mr-2 mt-4"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </Form.Group>
              {loading && <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading...</span></div>}
              {notification.message && (
                <div
                  className={`alert mt-4 ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  role="alert"
                >
                  {notification.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-domain"></i>
          </span>{" "}
          Employee by Project{" "}
        </h3>
      </div>
      <div className="row">
        {Object.keys(groupedEmployees).map((companyName) => (
          <div className="col-lg-12 grid-margin stretch-card" key={companyName}>
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">{companyName}</h4>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th> User </th>
                        <th> Role </th>
                        <th> Work Hours </th>
                        <th> Gender </th>
                        <th> Email </th>
                        <th> Base Salary </th>
                        <th> Progress </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedEmployees[companyName].map((employee) => (
                        <tr key={employee.id}>
                          <td className="py-1">
                            <img
                              src={require(`../../assets/images/faces/face${employee.profile_pic?employee.profile_pic:'1'}.jpg`)}
                              alt="user icon"
                              onError={handleImageError}
                              style={{
                                width: "30px",
                                height: "auto",
                                marginRight: "14px",
                              }} 
                            />
                            {`${employee.first_name || ''} ${employee.last_name || ''}`}
                          </td>
                          <td>{`${capitalizeFirstLetter(employee.role)}`}</td>
                          <td>{`${employee.working_hours || 0} Hours`}</td>
                          <td>{`${capitalizeFirstLetter(employee.gender)}`}</td>
                          <td>
                            <a href={`mailto:${employee.email}`}>
                              <i className="mdi mdi-email"></i> {employee.email}
                            </a>
                          </td>
                          <td>{formatSalary(employee.base_salary)}</td>
                          <td>
                            <ProgressBar
                              variant={getProgressBarVariant(employee.progress)}
                              now={employee.progress}
                            />
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Function to determine ProgressBar variant based on progress value
const getProgressBarVariant = (progress) => {
  if (progress <= 25) {
    return "success";
  } else if (progress <= 50) {
    return "primary";
  } else if (progress <= 75) {
    return "warning";
  } else {
    return "danger";
  }
};

export default BasicTable;
