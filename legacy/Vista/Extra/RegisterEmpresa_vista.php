   <body>

       <header>
           <h1>Spotrack</h1>
           <h2>HOLA</h2>
       </header>

       <!--             ----    PARTE EMPRESA                   ---    -->
       <content>
           <div class="window" id="ParteEmpresa">
               <div class="window_title">
                   Registrarse
               </div>

               <div class="window_container">
                   <form action="" method="POST">

                       <label class="lbl" for="txtRazonSocial">Razon Social</label>
                       <input class="txt" type="text" id="txtRazonSocial" name="txtRazonSocial" required>

                       <label class="lbl" for="txtUbicacion">Ubicacion:</label>
                       <input class="txt" type="text" id="txtUbicacion" name="txtUbicacion" required>

                       <div class="window_error">
                           <h6>
                              {{MENSAJE}}
                               <!-- <?php

                                echo $msg;

                                ?>
 -->                           </h6>
                       </div>

                       <div class="window_control">

                           <div class="window_control"> <input id="btnEmpresa" name="btnEmpresa" class="btn" type="submit" value="Registrarse"></input></div>

                           <div class="window_options"> ¿Quieres Completar la informacion luego? <a href="../index.php" class="lnk">Si.</a> </div>
                       </div>
                   </form>
               </div>
           </div>
       </content>