import "./history.css"
import Plane from "@/assets/plane.png"
import Filter from "@/assets/filter.png"
import Search from "@/assets/search.png"
import React, { useEffect, useState } from 'react'

interface HistoryItem {
  id: number;
  name: string;
  date: string;
  result: string;
}

export default function History() {
  const [data, setData] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch ("/api/history")
        if (!res.ok) throw new Error("Failed to fetch data from server")
          else {
            const json = await res.json()
            setData(json)
          }

      } catch (error) {
        console.error("Error fetching data", error)
      }
    }
    fetchData()
  }, [])

  const handleView = (item: HistoryItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="history-page">

        <div className="filter">
          <p className="filter-title"> History </p>
          <div className="filter-tools">
            <div className="filter-bar">
              <img className="filter-search" src={Search} alt="search"/>
              <input className="filter-input" />
              <img className="filter-send" src={Plane} alt="plane" />
            </div>

            <img className="filter-filter" src={Filter} alt="filter" />
          </div>
        </div>

        <div className="table">
          <div className="table-header">
            <p className="table-header-name">Name</p>
            <p className="table-header-data">Data</p>
            <p className="table-header-result">Results</p>
          </div>

          <div className="table-data">
          {data.map((item) => (
            <div className="table-row" key={item.id}>
              <p className="table-cell">{item.name}</p>
              <p className="table-cell">{item.date}</p>
              <button className="view-button" onClick={() => handleView(item)}>
              View Results
              </button>
              </div>
          ))}
          </div>

          <div className="table-footer">
          </div>
          <div>
          {isModalOpen && selectedItem && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Result Details</h3>
              <p>Name:{selectedItem.name}</p>
              <p>Date:{selectedItem.date}</p>
              <p>Result:{selectedItem.result}</p>
              <button onClick={closeModal}>Close</button>
              </div>
              </div>
              )}
          </div>
        </div>
      </div>
  )
}
