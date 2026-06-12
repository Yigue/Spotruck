<body>
    <div class="menu ocultar">
        <div id="menu-close" class="nav-menu">
            <img src="../img/system/cerrar.svg" width="40px">
        </div>
        <h1>MENU</h1>

        <div class="menu-separador"></div>
        <form action="../Control/paginaCamionero_control.php" method="POST">
            <input type="submit" class="btn" id="btnPerfil" name="btnPerfil" value="Perfil">
            <p></p>
            <a href="" class="btn">Ayuda</a>
            <p></p>
            <input type="submit" class="btn" id="btnLogout" name="btnLogout" value="Cerrar Sesion">
        </form>


    </div>

    <header>
        <div id="nav-logo">

        </div>

        <div id="nav-section">
            <h1>Spotruck</h1>
        </div>

        <div id="nav-menu">
            <img src="../img/system/menu.svg" width="20px">
        </div>
    </header>

    <nav>

    </nav>

    <content>

        <h2>Publicaciones camioneros</h2>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1490.1951984635648!2d-0.8897282384751197!3d41.6689113893635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd5914a2dbaef783%3A0xcefbedb5510a16d!2sUup!5e0!3m2!1ses!2ses!4v1535631076018" width="90%" height="400vh" frameborder="0" style="border:0" allowfullscreen></iframe>

        <!-- <div class="window">
            <div class="window_title">
                Publicacion 1
            </div>
            <!--             Ejemplo De publicacion    
            <div class="window_container">

                <div class="window_image">
                    <img src="https://th.bing.com/th/id/OIP.mjhozYsO6Z6EZwj4EVqtKAHaEc?pid=ImgDet&rs=1" alt="" h>
                </div>

                <div class="window_control">

                    <h2>Cargamento:</h2>
                    <h2>Ubicacion:</h2>
                    <h2>Tipos:</h2>

                    <!-- VENTANA POPUP
                    <div id="detalles" class="detalles">
                        <div class="contdetalles">
                            <h1>DETALLES</h1>
                            <p>Cargamente</p>
                            <p>Peso</p>
                            <p>Detalles</p>
                            <p>Ubicacion</p>
                            <button id="cerrar">Cerrar</button>
                        </div>
                    </div>
                    <!-- FINPOP 

                    <button id="ver" class="btn">Ver detalles</button>
                    <a href="" class="btn">Postularse</a>

                </div>

            </div> -->
        </div>

        <!-- Buscar forma para que las funciones de js esten en otro archivo -->
        <script type="text/javascript">
            const ver = document.getElementById('ver1');
            const detalles = document.getElementById('model1');
            const cerrar = document.getElementById('cerrar');

            ver.addEventListener('click', () => {
                detalles.classList.add('show');
            });

            cerrar.addEventListener('click', () => {
                detalles.classList.remove('show');
            });


            document.addEventListener("DOMContentLoaded", () => {

                document.querySelector("#nav-menu").addEventListener("click", event => {

                    document.querySelector(".menu").classList.add("mostrar")
                    document.querySelector(".menu").classList.remove("ocultar")
                })

                document.querySelector("#menu-close").addEventListener("click", event => {

                    document.querySelector(".menu").classList.add("ocultar")
                    document.querySelector(".menu").classList.remove("mostrar")

                })
            })
        </script>