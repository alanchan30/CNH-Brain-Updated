import "./history.css"
import Plane from "@/assets/plane.png"
import Filter from "@/assets/filter.png"
import Search from "@/assets/search.png"
import React from 'react'

export default function History() {
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
            <p>Name</p>
            <p>Data</p>
            <p>Results</p>
          </div>

          <div className="table-data">

          </div>

          <div className="table-footer">
          </div>
        </div>
      </div>
  )
}
