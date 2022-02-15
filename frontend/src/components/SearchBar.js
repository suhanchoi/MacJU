import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from 'react-router-dom';
import '../styles/SearchBar.css'
import axios from "axios"
// import { useDispatch } from "react-redux";
// import { ListGroup } from "react-bootstrap";
import {Delay, GetPoint, GetPath} from './searchBarFunc'
import { gsap } from "gsap/dist/gsap";
import SearchResult from "./SearchResult";
import axiosInstance from 'CustomAxios'
const { to, set } = gsap

function SearchBar(){
  const SEARCH_URL = process.env.REACT_APP_SERVER + ':8888'
  const location = useLocation();
  const history = useHistory();
  const [searchInput, setSearchInput] = useState('');   // 검색할 단어
  const [searchAll , setSearchAll] = useState([])   // 모든 검색 결과
  
  
  const setInput = async (e) => {
    setSearchInput(e.target.value);
  }
  
  const eraseInput = (e) => {
    e.preventDefault()
    setSearchInput("");
  }

  // enter or click 했을때
  const SearchSubmit = ((e)=> {
    e.preventDefault()
    console.log('검색할 값 :', searchInput)
    history.replace({pathname:`/search/${searchInput}`, searchInput:searchInput, searchAll:searchAll})
    // history.push(`/search?${searchInput}`)
  })

  
  // 검색결과 get 요청
  const fetchSearchResult = async () =>{
    setSearchAll([])
    const beerKosearch = axiosInstance.get(`${SEARCH_URL}/v1/search/name?query=${searchInput}&lang=ko`)
    const beerEnsearch = axiosInstance.get(`${SEARCH_URL}/v1/search/name?query=${searchInput}&lang=en`)
    const aromasearch = axiosInstance.get(`${SEARCH_URL}/v1/search/aroma?query=${searchInput}`)
    const flavorsearch = axiosInstance.get(`${SEARCH_URL}/v1/search/flavor?query=${searchInput}`)
    const typesearch = axiosInstance.get(`${SEARCH_URL}/v1/search/type?query=${searchInput}`)
    const usersearch = axiosInstance.get(`${SEARCH_URL}/v1/search/user?query=${searchInput}`)
    Promise.allSettled([beerKosearch, beerEnsearch, aromasearch, flavorsearch, typesearch,usersearch])
    .then((results)=>
    results.map((result, i) => {
      if (result.status === 'fulfilled') {
        setSearchAll((prev)=>[...prev, result.value]) 
      }
    })
    )
     
  }

  useEffect( () => {
    if (searchInput) {fetchSearchResult()}

  }, [searchInput])  

  function EraseEffect() {
  
    document.querySelectorAll('.input').forEach( elem => {
      let clear = elem.querySelector('.clear'),
                  input = elem.querySelector('input'),
                  { classList } = elem,
                  svgLine = clear.querySelector('.line'),
                  svgLineProxy = new Proxy(
                    { x: null },
                    {
                      set(target, key, value) {
                        target[key] = value
                        if(target.x !== null) {
                          svgLine.setAttribute('d', GetPath(target.x, .1925))
                        }
                        return true
                      },
                      get(target, key) {
                        return target[key]
                      }
                    }
                  )
  
      svgLineProxy.x = 0
      
      input.addEventListener('input', Delay(e => {
        let bool = input.value.length
        to(elem, {
          '--clear-scale': bool ? 1 : 0,
          duration: bool ? .5 : .15,
          ease: bool ? 'elastic.out(1, .7)' : 'none'
        })
        to(elem, {
          '--clear-opacity': bool ? 1 : 0,
          duration: .15
        })
      }, 250))
  
      clear.addEventListener('click', e => {
        setSearchAll([])
        classList.add('clearing')
        set(elem, {
          '--clear-swipe-left': (input.offsetWidth - 16) * -1 + 'px'
        })
  
        to(elem, {
          keyframes: [{
            '--clear-rotate': '45deg',
            duration: .25
          }, {
            '--clear-arrow-x': '2px',
            '--clear-arrow-y': '-2px',
            duration: .15
          }, {
            '--clear-arrow-x': '-3px',
            '--clear-arrow-y': '3px',
            '--clear-swipe': '-3px',
            duration: .15,
            onStart() {
              to(svgLineProxy, {
                x: 3,
                duration: .1,
                delay: .05
              })
            }
          }, {
            '--clear-swipe-x': 1,
            '--clear-x': (input.offsetWidth) * -1 + 'px',
            duration: .45,
            onComplete() {
              input.value = ''
              input.focus()
              to(elem, {
                '--clear-arrow-offset': '4px',
                '--clear-arrow-offset-second': '4px',
                '--clear-line-array': '8.5px',
                '--clear-line-offset': '27px',
                '--clear-long-offset': '24px',
                '--clear-rotate': '0deg',
                '--clear-arrow-o': 1,
                duration: 0,
                delay: .7,
                onStart() {
                  classList.remove('clearing')
                }
              })
              to(elem, {
                '--clear-opacity': 0,
                duration: .2,
                delay: .55
              })
              to(elem, {
                '--clear-arrow-o': 0,
                '--clear-arrow-x': '0px',
                '--clear-arrow-y': '0px',
                '--clear-swipe': '0px',
                duration: .15
              })
              to(svgLineProxy, {
                x: 0,
                duration: .45,
                ease: 'elastic.out(1, .75)'
              })
            }
          }, {
            '--clear-swipe-x': 0,
            '--clear-x': '0px',
            duration: .4,
            delay: .35
          }]
        })
  
        to(elem, {
          '--clear-arrow-offset': '0px',
          '--clear-arrow-offset-second': '8px',
          '--clear-line-array': '28.5px',
          '--clear-line-offset': '57px',
          '--clear-long-offset': '17px',
          duration: .2
        })
      })
  
    })
  }

  useEffect( () => {
    EraseEffect()
  }, [])


  useEffect(()=>{
    setSearchInput('')
    setSearchAll([])
  }, [location])
  

  return(
    <>
      <form className="input" onSubmit={SearchSubmit}>

        {/* 검색창 */}
        <button type="submit" className="searchicon"><i className="fa fa-search"></i></button>
        <div className="text" id="dropdown">
          <input id="input" type="text" placeholder="검색..." onChange={setInput} autoComplete={"off"} value={searchInput}/>
        </div>
        
        {/* 지우기 버튼 */}
        <button className="clear" onClick={ eraseInput } >
          <svg viewBox="0 0 24 24">
            <path className="line" d="M2 2L22 22" />
            <path className="long" d="M9 15L20 4" />
            <path className="arrow" d="M13 11V7" />
            <path className="arrow" d="M17 11H13" />
          </svg>
        </button>
        
      </form>

      <SearchResult data={searchAll}/>

    </>
  )
}




export default SearchBar;
