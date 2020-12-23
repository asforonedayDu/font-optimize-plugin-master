
# font-optimize-vue-plugin-master

这个webpack插件用于字体文件大小优化、字体格式转换以及相应的CSS代码适配。

只支持TTF/OTF/SVG格式作为原始字体，OTF字体无法精简，生成的其它格式可精简化。

### 详情

- 字体优化

  这个插件允许你指定特定的汉字，将字体文件的其它汉字删除，生成精简后的字体文件。
  
  往往我们需要的汉字就是项目代码中出现的中文，你可以指定若干目录，插件会遍历目录下的文件，搜索出所有中文。
- 格式转换

  为了满足浏览器兼容性要求，在精简汉字的同时，可以转换生成多种字体格式，支持生成otf ttf eot woff woff2几种主流格式。
  
  
  字体格式转换基于 [font-min](https://github.com/ecomfe/fontmin)
- css代码适配

  生成了新的字体文件后，引用它的css代码也会更新，会调用所有生成的字体文件。
- 支持

  支持 Vue-cli Webpack-cli 项目，其它cli项目未测试。

## 安装

```bash
npm install --save-dev font-optimize-vue-plugin-master
```


## 配置参数


#### `spiderDir`

类型: `String|Array`
可为空: `否`

指定搜索的目录，将在这些目录下搜索所有的汉字.

比如src/  搜索相对路径下src文件夹下的所有文件

单字符串，即搜索一个目录，或者字符串数组，搜索多个目录。

#### `extraContents`

类型: `String`
默认值: ``

除了从文件中搜索出的汉字，额外指定自己想要的字符串。

#### `optimizeFileTypes`

类型: `String|Array`
默认值: `[]`


搜索汉字时指定文件后缀，比如‘vue|js’，表示只在.vue或.js文件里面搜索汉字。

考虑到项目代码文件类型多，可能只需要在某些文件里面搜索汉字.

单字符串，用|分隔不同后缀，比如‘vue|js|css’,或者数组['css','js']。

#### `optimizeFontNames`

类型: `String|Array`
默认值: `[]`

要优化的字体文件名，不需要后缀，只需要文件名，不用路径信息.

比如‘Alibaba-PuHuiTi-Medium’

单字符串，即优化一个字体文件，或者字符串数组，优化多个字体。

默认优化所有符合格式的字体



#### `outputFontTypes`

类型: `String|Array`

默认值: `['woff2', 'woff', 'otf', 'ttf', 'eot', 'svg']`

要生成的字体文件格式，目前支持otf ttf eot woff woff2五种格式。

比如设置为：‘woff2|woff|ttf|eot’，将会生成四个对应的字体文件，并且会依照这个前后顺序由CSS代码引用。

如果包含EOT格式，会额外添加一个src属性以兼容IE，可参考示例。

字符串形式用竖线分隔，数组形式例如：['woff2','ttf']。





### CSS代码适配
  
   
 - 举个栗子：

   **CSS中有以下代码**
   
   ```css
   @font-face {
     font-family: 'AlibabaPuHuiTi';
     src: url('fonts/Alibaba-PuHuiTi-Medium.ttf');
     font-weight: 600;
     font-style: normal;
   }
   ```
   
   **webpack配置为：**
   ```js
   new fontOptimizePlugin({
     spiderDir: 'src/views',
     optimizeFontNames: 'Alibaba-PuHuiTi-Medium',
     optimizeFileTypes: 'vue|js',
     extraContents: '`~!@#$%^&*()_\\-+=<>?:"{}|,./;\'[]·~！@#￥%……&*（）——-+={}|《》？：“”【】、；‘\'，。、',
     outputFontTypes: ['woff2', 'woff', 'otf', 'ttf', 'eot', 'svg']
   })
   ```
    
   **那么，最后生成的CSS代码将会类似于：**
   
   ```css
   @font-face {
     font-family: AlibabaPuHuiTi;
     src: url(../fonts/font-optimized.3774bf85.eot);
     src: url(../fonts/font-optimized.a3f7e1f1.woff2) format("woff2"), 
          url(../fonts/font-optimized.a9afa3ee.woff) format("woff"), 
          url(../fonts/Alibaba-PuHuiTi-Medium.d9aa9348.ttf) format("truetype"), 
          url(../fonts/font-optimized.3774bf85.eot) format("embedded-opentype"), 
          url(../img/font-optimized.db1bd72a.svg) format("svg");
     font-weight: 600;
     font-style: normal;
   }
   ```

   生成的这几个字体文件都是精简后的(除了otf)。
   
   注意， 如果你的CSS代码中，对应的font-face下有多个src属性，除了匹配的字体文件，其它字体文件会被删去。


### Vue-cli配置示例：
   ```js
   const fontOptimizePlugin = require('font-optimize-vue-plugin-master')

   config.plugin('fontOptimizePlugin').use(fontOptimizePlugin, [
         {
            spiderDir: 'src/views',
            optimizeFontNames: 'Alibaba-PuHuiTi-Medium',
            optimizeFileTypes: 'vue|js',
            extraContents: '`~!@#$%^&*()_\\-+=<>?:"{}|,./;\'[]·~！@#￥%……&*（）——-+={}|《》？：“”【】、；‘\'，。、',
            outputFontTypes: 'woff2|woff|ttf|eot'
         }
       ])
   ```
