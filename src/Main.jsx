import React, { useContext, useState, useEffect } from 'react';
import { PatientContext } from './App';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './index.css'; // 커스텀 스타일 추가
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Medications from './Medications';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Main = () => {
    const { selectedPatient, setPatients, updatePatientInFirestore } = useContext(PatientContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPatient, setEditedPatient] = useState(null);

    useEffect(() => {
        if (selectedPatient) {
            setEditedPatient(selectedPatient);
        }
    }, [selectedPatient]);

    const handleSave = async () => {
        if (editedPatient) {
            await updatePatientInFirestore(editedPatient);
            setPatients(prevPatients =>
                prevPatients.map(p =>
                    p.id === editedPatient.id ? editedPatient : p
                )
            );
            setIsEditing(false);
        }
    };

    if (!selectedPatient) {
        return <div className="flex justify-center items-center h-full">환자를 선택해주세요.</div>;
    }

    return (
        <div className="layout-content-container flex flex-col flex-1 p-4">
            <PatientHeader
                patient={editedPatient}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                handleSave={handleSave}
                setEditedPatient={setEditedPatient}
            />
            <div className="flex flex-1">
                <div className="flex flex-col w-1/2 pr-2">
                    <PatientInfo patient={editedPatient} isEditing={isEditing} setEditedPatient={setEditedPatient} />
                    <Medications />
                </div>
                <div className="flex flex-col w-1/2 pl-2">
                    <Vitals
                        patient={editedPatient}
                        setEditedPatient={setEditedPatient}
                        updatePatientInFirestore={updatePatientInFirestore}
                        isEditing={isEditing}
                    />
                </div>
            </div>
        </div>
    );
};

const PatientHeader = ({ patient, isEditing, setIsEditing, handleSave, setEditedPatient }) => {
    const handleNameChange = (e) => {
        setEditedPatient(prev => ({ ...prev, name: e.target.value }));
    };

    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex-grow max-w-[calc(100%-80px)]">
                {isEditing ? (
                    <input
                        type="text"
                        value={patient?.name || ''}
                        onChange={handleNameChange}
                        className="text-[32px] tracking-light font-bold leading-tight whitespace-nowrap bg-transparent border-none focus:outline-none w-full"
                    />
                ) : (
                    <p className="text-[32px] tracking-light font-bold leading-tight whitespace-nowrap truncate">{patient?.name || '새 환자'}</p>
                )}
            </div>
            <div className="flex-shrink-0 ml-4">
                <button
                    className="text-gray-500 rounded text-sm font-medium leading-normal"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                    {isEditing ? '저장' : '수정'}
                </button>
            </div>
        </div>
    );
};

const PatientInfo = ({ patient, isEditing, setEditedPatient }) => {
    const handleChange = (field, value) => {
        setEditedPatient(prev => {
            const updatedPatient = { ...prev, [field]: value };
            // BMI 자동 계산
            if (field === 'height' || field === 'weight') {
                const height = field === 'height' ? parseFloat(value) : parseFloat(prev.height);
                const weight = field === 'weight' ? parseFloat(value) : parseFloat(prev.weight);
                if (height && weight) {
                    const heightInMeters = height / 100;
                    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
                    updatedPatient.bmi = bmi;
                }
            }
            return updatedPatient;
        });
    };

    // BMI 계산 함수
    const calculateBMI = (height, weight) => {
        if (height && weight) {
            const heightInMeters = height / 100;
            return (weight / (heightInMeters * heightInMeters)).toFixed(2);
        }
        return '';
    };

    // BMI 값 계산
    const bmiValue = calculateBMI(patient?.height, patient?.weight);

    return (
        <div className="p-4 grid grid-cols-[20%_1fr] gap-x-6">
            <InfoItem label="성별" value={patient?.gender} field="gender" isEditing={isEditing} onChange={handleChange} />
            <InfoItem label="나이" value={patient?.age} field="age" isEditing={isEditing} onChange={handleChange} />
            <InfoItem label="키" value={patient?.height} field="height" isEditing={isEditing} onChange={handleChange} />
            <InfoItem label="체중" value={patient?.weight} field="weight" isEditing={isEditing} onChange={handleChange} />
            <InfoItem label="BMI" value={bmiValue} field="bmi" isEditing={false} onChange={handleChange} />
            <InfoItem label="혈액형" value={patient?.bloodType} field="bloodType" isEditing={isEditing} onChange={handleChange} />
        </div>
    );
};

const InfoItem = ({ label, value, field, isEditing, onChange }) => (
    <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#E0E0E0] py-5">
        <p className="text-neutral-500 text-sm font-normal leading-normal">{label}</p>
        {isEditing ? (
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(field, e.target.value)}
                className="text-[#141414] text-sm font-normal leading-normal focus:outline-none px-1 border-none"
                style={{ minWidth: '20px' }}
            />
        ) : (
            <p className="text-[#141414] text-sm font-normal leading-normal">{value || '정보 없음'}</p>
        )}
    </div>
);

const SectionHeader = ({ title, onAdd, onDelete }) => (
    <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em]">{title}</h3>
        <div className="flex gap-2">
            <button
                className="text-gray-500 rounded text-sm font-medium leading-normal"
                onClick={onAdd}
            >
                추가
            </button>
            <button
                className="text-gray-500 rounded text-sm font-medium leading-normal"
                onClick={onDelete}
            >
                삭제
            </button>
        </div>
    </div>
);

const Vitals = ({ patient, setEditedPatient, updatePatientInFirestore, isEditing }) => {
    const [selectedVital, setSelectedVital] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [newValue, setNewValue] = useState('');
    const vitalNames = ['산소포화도', '혈당', '혈압'];

    const handleVitalClick = (index) => {
        if (isEditing) {
            setSelectedVital(index);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleValueChange = (e) => {
        setNewValue(e.target.value);
    };

    const handleSave = async () => {
        if (selectedVital !== null && selectedDate && newValue) {
            const updatedVitals = [...patient.vitals];
            const vitalIndex = selectedVital;
            const dateString = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000))
                .toISOString().split('T')[0];

            if (!updatedVitals[vitalIndex].data) {
                updatedVitals[vitalIndex].data = {};
            }

            if (updatedVitals[vitalIndex].title === "혈압") {
                // 혈압의 경우 [수축기, 이완기] 형태로 저장
                const [systolic, diastolic] = newValue.split('/').map(v => parseFloat(v.trim()));
                updatedVitals[vitalIndex].data[dateString] = [systolic, diastolic];
            } else {
                updatedVitals[vitalIndex].data[dateString] = parseFloat(newValue);
            }

            const updatedPatient = {
                ...patient,
                vitals: updatedVitals
            };

            await updatePatientInFirestore(updatedPatient);
            setEditedPatient(updatedPatient);
            setSelectedVital(null);
            setSelectedDate(null);
            setNewValue('');
        }
    };

    return (
        <>

            <div className="flex flex-col gap-4 px-4 py-6">
                {patient?.vitals?.map((vital, index) => (
                    <VitalChart
                        key={index}
                        title={vitalNames[index]}
                        data={vital.data}
                        isEditing={isEditing}
                        isSelected={selectedVital === index}
                        onClick={() => handleVitalClick(index)}
                    />
                ))}
            </div>
            {isEditing && selectedVital !== null && (
                <div className="px-4 py-2">
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateSelect}
                        inline
                    />
                    {selectedDate && (
                        <div className="mt-2">
                            <input
                                type="text"
                                value={newValue}
                                onChange={handleValueChange}
                                className="border rounded px-2 py-1"
                            />
                            <button
                                onClick={handleSave}
                                className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
                            >
                                저장
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

const VitalChart = ({ title, data, isEditing, isSelected, onClick }) => {
    const sortedDates = Object.keys(data || {}).sort();
    const latestFiveData = sortedDates.slice(-5);

    let chartData;
    let options;

    if (title === "혈압") {
        const filteredDates = latestFiveData.filter(date => date !== '0' && date !== '1');
        chartData = {
            labels: filteredDates,
            datasets: [
                {
                    label: '수축기',
                    data: filteredDates.map(date => data[date] ? data[date][0] : null),
                    borderColor: 'rgb(255, 99, 132)',
                    fill: false,
                },
                {
                    label: '이완기',
                    data: filteredDates.map(date => data[date] ? data[date][1] : null),
                    borderColor: 'rgb(54, 162, 235)',
                    fill: false,
                }
            ]
        };
        options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: false, text: title },
            },
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom',
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 40 }
                },
            },
        };
    } else {
        chartData = {
            labels: latestFiveData,
            datasets: [{
                label: title,
                data: latestFiveData.map(date => data[date]),
                borderColor: 'rgb(75, 192, 192)',
                fill: false,
            }]
        };
        options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false, text: title },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: title === "혈당" ? 50 : 20
                    }
                },
            },
        };
    }

    return (
        <div
            className={`flex min-w-72 min-h-[90px] flex-1 flex-col gap-2 rounded border border-[#E0E0E0] p-6 ${isEditing ? 'cursor-pointer' : ''} ${isSelected ? 'border-blue-500' : ''}`}
            onClick={onClick}
        >
            <p className="text-[#141414] text-base font-medium leading-normal">{title}</p>
            <div className="flex min-h-[90px] flex-1 flex-col gap-8 py-4">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default Main;