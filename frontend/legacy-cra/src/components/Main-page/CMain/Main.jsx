import Slider from '../CSlider/Slider'
import './../CMain/Main.scss'
import { Link } from "react-router-dom";  // Добавил импорт Link
import image_bank from './../../../img/Cbank.svg'
import AutoLast from '../CAuto-main/Auto-main'
import kia from './../../../img/kia.png'
import fer from './../../../img/fer.png'
import bmw from './../../../img/bmw.png'
import lexus from './../../../img/lexus.png'
import sale from './../../../img/Group 96.png'
function Main() {
    return (
        <div className='containers'>
            <div className="advertising"><Slider />
                <img className='bank-images' src={image_bank} alt="bank" />

                <img className='sale-images' src={sale} alt="sale" />
            </div>

            <div className="last_auto">
                <AutoLast />
                <div className="last-cont">
                    <Link to="/buy-page">
                        <button className="show-car-button">
                            Показать больше
                        </button>
                    </Link>
                </div>
            </div>

            <div className="conteiner_services">
                <div className="services_mark">
                    <img className='kia-images' src={kia} alt="kia" />
                    <div className="but_mark">
                        <button>Оценить автомобиль</button>
                    </div>
                </div>

                <div className="services_ferrari">
                    <img className='fer-images' src={fer} alt="fer" />
                    <div className="txt_fer">
                        <h2>Отчеты</h2>
                        <p>Бесплатные отчеты по автомобилю:ДТП/Такси/Залоги/Ограничения</p>
                        <div className="a_fer">
                            <button className="details-button">Подробнее</button>
                        </div>
                    </div>
                </div>

                <div className="services_ferrari">
                    <img className='bmw-images' src={bmw} alt="bmw" />
                    <div className="txt_fer">
                        <h2>Онлайн коммиссия</h2>
                        <p>Бесплатное размещение авто, прикрепление к нему отчетов.Торги автомобилем Жукова 65/1</p>
                        <div className="a_fer">
                            <button className="details-button">Подробнее</button>
                        </div>
                    </div>
                </div>

                <div className="services_ferrari">
                    <img className='lexus-images' src={lexus} alt="lexus" />
                    <div className="txt_fer">
                        <h2>Выкуп</h2>
                        <p>Выкуп размещенных авто, расчет в трейд-ин,кредит с партнерами ПримСоцБанк</p>
                        <div className="a_fer">
                            <button className="details-button">Подробнее</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Main;